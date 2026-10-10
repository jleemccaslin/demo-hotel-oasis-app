import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettings, updateSetting } from "../src/services/apiSettings";
import { supabaseFake } from "./supabaseFake";

vi.mock("../src/services/supabase", async () => {
  const { supabaseFake } = await import("./supabaseFake");
  return { default: supabaseFake.client };
});

beforeEach(() => {
  supabaseFake.reset();
});

// ─────────────────────────────────────────────
// getSettings
// ─────────────────────────────────────────────
describe("getSettings", () => {
  it("returns the single settings row", async () => {
    const settings = { id: 1, minBookingLength: 3, maxBookingLength: 90 };
    supabaseFake.resolveNext({ data: settings });

    const result = await getSettings();

    expect(result).toEqual(settings);

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("settings");
    expect(query.calls).toContainEqual(["select", "*"]);
    expect(query.calls).toContainEqual(["single"]);
  });

  it("throws when supabase returns an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "fail" } });

    await expect(getSettings()).rejects.toThrow("Settings could not be loaded");
  });
});

// ─────────────────────────────────────────────
// updateSetting
// ─────────────────────────────────────────────
describe("updateSetting", () => {
  it("updates the settings row and returns it", async () => {
    supabaseFake.resolveNext({ data: { minBookingLength: 5 } });

    const result = await updateSetting({ minBookingLength: "5" });

    // The fake only returns the row if .select() was chained, like Supabase
    expect(result).toEqual({ minBookingLength: 5 });

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("settings");
    expect(query.calls).toContainEqual(["update", { minBookingLength: "5" }]);
    // There is only one settings row, and it has the id 1
    expect(query.calls).toContainEqual(["eq", "id", 1]);
  });

  it("throws when update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "fail" } });

    await expect(updateSetting({ maxBookingLength: "120" })).rejects.toThrow(
      "Setting could not be updated",
    );
  });
});
