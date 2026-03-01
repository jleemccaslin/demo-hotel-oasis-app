import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
} from "../src/services/apiBookings";

// ─────────────────────────────────────────────
// Mock Supabase
// ─────────────────────────────────────────────
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../src/services/supabase", () => ({
  supabaseUrl: "https://test.supabase.co",
  default: {
    from: vi.fn(() => ({
      select: mockSelect,
      delete: mockDelete,
      update: mockUpdate,
    })),
  },
}));

// Mock helpers so getToday returns a stable value
vi.mock("../src/utils/helpers", () => ({
  getToday: vi.fn(() => "2024-06-15T00:00:00.000Z"),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// getBookings
// ─────────────────────────────────────────────
describe("getBookings", () => {
  it("returns data and count on success", async () => {
    const bookings = [{ id: "1" }];
    // Build the chain: select -> order -> range -> { data, error, count }
    mockRange.mockResolvedValue({ data: bookings, error: null, count: 1 });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({
      order: mockOrder,
      eq: mockEq,
      range: mockRange,
    });

    const result = await getBookings({
      sortBy: { field: "startDate", direction: "asc" },
      page: 1,
    });

    expect(result).toEqual({ data: bookings, count: 1 });
    expect(mockOrder).toHaveBeenCalledWith("startDate", { ascending: true });
  });

  it("applies descending sort correctly", async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({ order: mockOrder, range: mockRange });

    await getBookings({
      sortBy: { field: "totalPrice", direction: "desc" },
      page: 1,
    });

    expect(mockOrder).toHaveBeenCalledWith("totalPrice", { ascending: false });
  });

  it("applies filter when provided", async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    mockEq.mockReturnValue({ order: mockOrder, range: mockRange });
    mockOrder.mockReturnValue({ range: mockRange });
    mockSelect.mockReturnValue({ eq: mockEq });

    await getBookings({
      filter: { field: "status", value: "checked-in" },
      sortBy: { field: "startDate", direction: "asc" },
      page: 1,
    });

    expect(mockEq).toHaveBeenCalledWith("status", "checked-in");
  });

  it("calculates correct pagination range", async () => {
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 });
    mockSelect.mockReturnValue({ range: mockRange });

    await getBookings({ page: 3 });

    // PAGE_SIZE is 10, so page 3: from=20, to=29
    expect(mockRange).toHaveBeenCalledWith(20, 29);
  });

  it("throws when supabase returns an error", async () => {
    // getBookings always chains .range(), so the mock must return a chainable object
    mockRange.mockResolvedValue({
      data: null,
      error: { message: "fail" },
      count: null,
    });
    mockSelect.mockReturnValue({ range: mockRange });

    await expect(getBookings()).rejects.toThrow("Bookings could not be loaded");
  });
});

// ─────────────────────────────────────────────
// getBooking
// ─────────────────────────────────────────────
describe("getBooking", () => {
  it("returns a single booking on success", async () => {
    const booking = { id: "5", status: "unconfirmed" };
    mockSingle.mockResolvedValue({ data: booking, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await getBooking("5");
    expect(result).toEqual(booking);
    expect(mockEq).toHaveBeenCalledWith("id", "5");
  });

  it("throws when booking is not found", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "not found" },
    });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });

    await expect(getBooking("999")).rejects.toThrow("Booking not found");
  });
});

// ─────────────────────────────────────────────
// updateBooking
// ─────────────────────────────────────────────
describe("updateBooking", () => {
  it("returns updated booking on success", async () => {
    const updated = { id: "5", status: "checked-in" };
    mockSingle.mockResolvedValue({ data: updated, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    const result = await updateBooking("5", { status: "checked-in" });
    expect(result).toEqual(updated);
  });

  it("throws when update fails", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "fail" } });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    await expect(updateBooking("5", {})).rejects.toThrow(
      "Booking could not be updated",
    );
  });
});

// ─────────────────────────────────────────────
// deleteBooking
// ─────────────────────────────────────────────
describe("deleteBooking", () => {
  it("completes without error on success", async () => {
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    await expect(deleteBooking("10")).resolves.toBeUndefined();
    expect(mockEq).toHaveBeenCalledWith("id", "10");
  });

  it("throws when delete fails", async () => {
    mockEq.mockResolvedValue({ error: { message: "fail" } });
    mockDelete.mockReturnValue({ eq: mockEq });

    await expect(deleteBooking("10")).rejects.toThrow(
      "Booking could not be deleted",
    );
  });
});
