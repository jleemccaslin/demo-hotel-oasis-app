import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { login, loginDemo, getCurrentUser } from "../src/services/apiAuth";
import { supabaseFake } from "./supabaseFake";

// Only the functions with decisions of their own are tested here. signup,
// logout and a successful login hand their arguments straight to Supabase, so
// a test of those would only be testing the fake

vi.mock("../src/services/supabase", async () => {
  const { supabaseFake, FAKE_SUPABASE_URL } = await import("./supabaseFake");
  return { default: supabaseFake.client, supabaseUrl: FAKE_SUPABASE_URL };
});

const NETWORK_ERROR_MESSAGE = "Couldn't reach server";

// What Supabase reports when a request never got a response at all
const offlineError = () => new AuthRetryableFetchError("Failed to fetch", 0);

beforeEach(() => {
  supabaseFake.reset();
});

// ─────────────────────────────────────────────
// login
// ─────────────────────────────────────────────
describe("login", () => {
  it("explains how to get back online when the request never reached the server", async () => {
    supabaseFake.resolveNextAuth({ error: offlineError() });

    await expect(login({ email: "a@b.c", password: "pw" })).rejects.toThrow(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it("passes on the server's own message when it did answer", async () => {
    supabaseFake.resolveNextAuth({
      error: new AuthApiError("Invalid login credentials", 400, "invalid"),
    });

    await expect(login({ email: "a@b.c", password: "pw" })).rejects.toThrow(
      "Invalid login credentials",
    );
  });

  it("does not blame the connection for a server that is merely overloaded", async () => {
    supabaseFake.resolveNextAuth({
      error: new AuthRetryableFetchError("Service unavailable", 503),
    });

    await expect(login({ email: "a@b.c", password: "pw" })).rejects.toThrow(
      "Service unavailable",
    );
  });
});

// ─────────────────────────────────────────────
// loginDemo
// ─────────────────────────────────────────────
describe("loginDemo", () => {
  const tokens = { access_token: "access-123", refresh_token: "refresh-456" };

  function stubFetch(response: Response | Error) {
    const fetchMock =
      response instanceof Error
        ? vi.fn().mockRejectedValue(response)
        : vi.fn().mockResolvedValue(response);

    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("starts a session from the tokens the demo-login function returns", async () => {
    const fetchMock = stubFetch(Response.json(tokens));
    const session = { user: { id: "demo" } };
    supabaseFake.resolveNextAuth({ data: session });

    const result = await loginDemo();

    expect(result).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith("/.netlify/functions/demo-login", {
      method: "POST",
    });
    expect(supabaseFake.authCalls).toEqual([["setSession", tokens]]);
  });

  it("explains how to get back online when the function can't be reached", async () => {
    stubFetch(new TypeError("Failed to fetch"));

    await expect(loginDemo()).rejects.toThrow(NETWORK_ERROR_MESSAGE);
    expect(supabaseFake.authCalls).toHaveLength(0);
  });

  it("shows the function's own error message when it refuses", async () => {
    stubFetch(
      Response.json({ error: "Demo login is not configured" }, { status: 500 }),
    );

    await expect(loginDemo()).rejects.toThrow("Demo login is not configured");
    expect(supabaseFake.authCalls).toHaveLength(0);
  });

  it("falls back to a generic message when the response is not JSON", async () => {
    // e.g. an HTML error page from the host instead of the function's answer
    stubFetch(new Response("<html>Bad gateway</html>", { status: 502 }));

    await expect(loginDemo()).rejects.toThrow("Demo login failed");
  });

  it("does not start a session when the response has no access token", async () => {
    stubFetch(Response.json({}));

    await expect(loginDemo()).rejects.toThrow("Demo login failed");
    expect(supabaseFake.authCalls).toHaveLength(0);
  });

  it("throws when Supabase rejects the tokens", async () => {
    stubFetch(Response.json(tokens));
    supabaseFake.resolveNextAuth({
      error: new AuthApiError("Invalid Refresh Token", 400, "invalid"),
    });

    await expect(loginDemo()).rejects.toThrow("Invalid Refresh Token");
  });
});

// ─────────────────────────────────────────────
// getCurrentUser
// ─────────────────────────────────────────────
describe("getCurrentUser", () => {
  it("returns null without asking for the user when nobody is logged in", async () => {
    supabaseFake.resolveNextAuth({ data: { session: null } });

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(supabaseFake.authCalls).toEqual([["getSession"]]);
  });

  it("returns the user when there is a session", async () => {
    const user = { id: "u1", email: "a@b.c" };
    supabaseFake.resolveNextAuth({ data: { session: { access_token: "t" } } });
    supabaseFake.resolveNextAuth({ data: { user } });

    await expect(getCurrentUser()).resolves.toEqual(user);
  });

  it("throws when the session can't be read", async () => {
    supabaseFake.resolveNextAuth({
      error: new AuthApiError("Session corrupted", 400, "invalid"),
    });

    await expect(getCurrentUser()).rejects.toThrow("Login error");
  });

  it("explains how to get back online when the user can't be fetched", async () => {
    supabaseFake.resolveNextAuth({ data: { session: { access_token: "t" } } });
    supabaseFake.resolveNextAuth({ data: { user: null }, error: offlineError() });

    await expect(getCurrentUser()).rejects.toThrow(NETWORK_ERROR_MESSAGE);
  });
});
