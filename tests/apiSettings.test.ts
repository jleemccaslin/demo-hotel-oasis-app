import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettings, updateSetting } from "../src/services/apiSettings";

// ─────────────────────────────────────────────
// Mock Supabase
// ─────────────────────────────────────────────
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock("../src/services/supabase", () => ({
  default: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// getSettings
// ─────────────────────────────────────────────
describe("getSettings", () => {
  it("returns settings data on success", async () => {
    const settings = { id: 1, minBookingLength: 3, maxBookingLength: 90 };
    mockSingle.mockResolvedValue({ data: settings, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });

    const result = await getSettings();
    expect(result).toEqual(settings);
    expect(mockSelect).toHaveBeenCalledWith("*");
  });

  it("throws when supabase returns an error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "fail" } });
    mockSelect.mockReturnValue({ single: mockSingle });

    await expect(getSettings()).rejects.toThrow("Settings could not be loaded");
  });
});

// ─────────────────────────────────────────────
// updateSetting
// ─────────────────────────────────────────────
describe("updateSetting", () => {
  it("returns updated data on success", async () => {
    mockSingle.mockResolvedValue({ data: { minBookingLength: 5 }, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const result = await updateSetting({ minBookingLength: "5" });
    expect(result).toEqual({ minBookingLength: 5 });
    expect(mockEq).toHaveBeenCalledWith("id", 1);
  });

  it("throws when update fails", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "fail" } });
    mockEq.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq });

    await expect(updateSetting({ maxBookingLength: "120" })).rejects.toThrow(
      "Setting could not be updated",
    );
  });
});
