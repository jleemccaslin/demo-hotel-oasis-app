import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import demoLogin from "../netlify/functions/demo-login";
import { resetAllTestData } from "../src/test-data/resetTestData";
import { supabaseFake } from "./supabaseFake";

// What is NOT tested here: that two demo logins arriving at the same moment
// only reset the data once. That guarantee comes from Postgres updating the
// settings row one request at a time, and a fake can't prove anything about
// that. These tests cover what the function does with each possible answer

// The function creates its own client, so the library is replaced rather than
// the app's supabase module
vi.mock("@supabase/supabase-js", async () => {
  const { supabaseFake } = await import("./supabaseFake");
  return { createClient: () => supabaseFake.client };
});

vi.mock("../src/test-data/resetTestData", () => ({
  resetAllTestData: vi.fn(),
}));

const tokens = { access_token: "access-123", refresh_token: "refresh-456" };

const postRequest = () =>
  new Request("http://localhost/.netlify/functions/demo-login", {
    method: "POST",
  });

function signInSucceeds() {
  supabaseFake.resolveNextAuth({ data: { session: tokens } });
}

beforeEach(() => {
  supabaseFake.reset();
  vi.mocked(resetAllTestData).mockReset();

  vi.stubEnv("VITE_API_KEY", "anon-key");
  vi.stubEnv("DEMO_MAIL", "demo@example.com");
  vi.stubEnv("DEMO_PASS", "demo-password");

  // Only the clock is faked, so the 6 hour staleness cutoff is predictable
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2024-06-15T15:30:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────
// Refusing the request
// ─────────────────────────────────────────────
describe("demo-login: refusing the request", () => {
  it("rejects anything but POST without touching Supabase", async () => {
    const response = await demoLogin(
      new Request("http://localhost/.netlify/functions/demo-login"),
    );

    expect(response.status).toBe(405);
    expect(supabaseFake.authCalls).toHaveLength(0);
  });

  it.each(["VITE_API_KEY", "DEMO_MAIL", "DEMO_PASS"])(
    "returns a 500 when %s is not configured",
    async (name) => {
      vi.stubEnv(name, "");

      const response = await demoLogin(postRequest());

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Demo login is not configured",
      });
      expect(supabaseFake.authCalls).toHaveLength(0);
    },
  );

  it("returns a 500 and resets nothing when the sign in fails", async () => {
    supabaseFake.resolveNextAuth({ error: { message: "Invalid credentials" } });

    const response = await demoLogin(postRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Demo login failed" });
    expect(supabaseFake.queries).toHaveLength(0);
    expect(resetAllTestData).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// Signing in
// ─────────────────────────────────────────────
describe("demo-login: signing in", () => {
  it("signs in with the demo credentials from the environment", async () => {
    signInSucceeds();

    await demoLogin(postRequest());

    expect(supabaseFake.authCalls).toEqual([
      [
        "signInWithPassword",
        { email: "demo@example.com", password: "demo-password" },
      ],
    ]);
  });

  it("returns the session tokens and nothing else", async () => {
    signInSucceeds();

    const response = await demoLogin(postRequest());

    expect(response.status).toBe(200);
    // The whole point of the function is that the credentials stay on the server
    expect(await response.json()).toEqual(tokens);
  });
});

// ─────────────────────────────────────────────
// Resetting stale demo data
// ─────────────────────────────────────────────
describe("demo-login: resetting stale demo data", () => {
  it("claims the reset only if the last one is older than 6 hours", async () => {
    signInSucceeds();

    await demoLogin(postRequest());

    const [claim] = supabaseFake.queries;
    expect(claim.table).toBe("settings");
    expect(claim.calls).toContainEqual([
      "update",
      { lastDemoReset: "2024-06-15T15:30:00.000Z" },
    ]);
    expect(claim.calls).toContainEqual(["eq", "id", 1]);
    expect(claim.calls).toContainEqual([
      "or",
      'lastDemoReset.is.null,lastDemoReset.lt."2024-06-15T09:30:00.000Z"',
    ]);
  });

  it("resets the data when it wins the claim", async () => {
    signInSucceeds();
    supabaseFake.resolveNext({ data: [{ id: 1 }] });

    await demoLogin(postRequest());

    expect(resetAllTestData).toHaveBeenCalledTimes(1);
  });

  it("leaves the data alone when it is fresh or another login claimed it", async () => {
    signInSucceeds();
    supabaseFake.resolveNext({ data: [] });

    const response = await demoLogin(postRequest());

    expect(resetAllTestData).not.toHaveBeenCalled();
    expect(await response.json()).toEqual(tokens);
  });

  it("releases the claim and still logs in when the reset fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signInSucceeds();
    supabaseFake.resolveNext({ data: [{ id: 1 }] });
    vi.mocked(resetAllTestData).mockRejectedValueOnce(new Error("boom"));

    const response = await demoLogin(postRequest());

    // Without the release, the next reset would be blocked for 6 hours
    const [, release] = supabaseFake.queries;
    expect(release.table).toBe("settings");
    expect(release.calls).toContainEqual(["update", { lastDemoReset: null }]);
    expect(release.calls).toContainEqual(["eq", "id", 1]);

    // Stale data is better than no login
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(tokens);
  });

  it("still logs in when the data's age can't be checked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signInSucceeds();
    supabaseFake.resolveNext({ error: { message: "settings unavailable" } });

    const response = await demoLogin(postRequest());

    expect(resetAllTestData).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(tokens);
  });
});
