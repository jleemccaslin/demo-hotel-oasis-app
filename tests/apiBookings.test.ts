import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getBookings,
  getBooking,
  getBookingsAfterDate,
  getStaysAfterDate,
  getStaysTodayActivity,
  updateBooking,
  deleteBooking,
} from "../src/services/apiBookings";
import { PAGE_SIZE } from "../src/utils/constants";
import { supabaseFake, argsOf } from "./supabaseFake";

vi.mock("../src/services/supabase", async () => {
  const { supabaseFake } = await import("./supabaseFake");
  return { default: supabaseFake.client };
});

beforeEach(() => {
  supabaseFake.reset();
});

// ─────────────────────────────────────────────
// getBookings
// ─────────────────────────────────────────────
describe("getBookings", () => {
  it("returns data and count on success", async () => {
    const bookings = [{ id: "1" }];
    supabaseFake.resolveNext({ data: bookings, count: 1 });

    const result = await getBookings();

    expect(result).toEqual({ data: bookings, count: 1 });

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("bookings");
    // Pagination depends on the exact total, not just the rows on this page
    expect(query.calls).toContainEqual([
      "select",
      expect.any(String),
      { count: "exact" },
    ]);
  });

  it("applies ascending sort", async () => {
    await getBookings({ sortBy: { field: "startDate", direction: "asc" } });

    const [query] = supabaseFake.queries;
    expect(query.calls).toContainEqual([
      "order",
      "startDate",
      { ascending: true },
    ]);
  });

  it("applies descending sort", async () => {
    await getBookings({ sortBy: { field: "totalPrice", direction: "desc" } });

    const [query] = supabaseFake.queries;
    expect(query.calls).toContainEqual([
      "order",
      "totalPrice",
      { ascending: false },
    ]);
  });

  it("applies filter when provided", async () => {
    await getBookings({ filter: { field: "status", value: "checked-in" } });

    const [query] = supabaseFake.queries;
    expect(query.calls).toContainEqual(["eq", "status", "checked-in"]);
  });

  it("neither filters nor sorts unless asked to", async () => {
    await getBookings();

    const [query] = supabaseFake.queries;
    const methods = query.calls.map(([method]) => method);
    expect(methods).not.toContain("eq");
    expect(methods).not.toContain("order");
  });

  it("requests the first page by default", async () => {
    await getBookings();

    const [query] = supabaseFake.queries;
    expect(query.calls).toContainEqual(["range", 0, PAGE_SIZE - 1]);
  });

  it("calculates the range of a later page", async () => {
    await getBookings({ page: 3 });

    const [query] = supabaseFake.queries;
    expect(query.calls).toContainEqual([
      "range",
      2 * PAGE_SIZE,
      3 * PAGE_SIZE - 1,
    ]);
  });

  it("throws when supabase returns an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "fail" } });

    await expect(getBookings()).rejects.toThrow("Bookings could not be loaded");
  });
});

// ─────────────────────────────────────────────
// getBooking
// ─────────────────────────────────────────────
describe("getBooking", () => {
  it("returns a single booking on success", async () => {
    const booking = { id: "5", status: "unconfirmed" };
    supabaseFake.resolveNext({ data: booking });

    const result = await getBooking("5");

    expect(result).toEqual(booking);

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("bookings");
    expect(query.calls).toContainEqual(["eq", "id", "5"]);
    expect(query.calls).toContainEqual(["single"]);
  });

  it("throws when booking is not found", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "not found" } });

    await expect(getBooking("999")).rejects.toThrow("Booking not found");
  });
});

// ─────────────────────────────────────────────
// Dashboard queries
// ─────────────────────────────────────────────
// All three compare against "today", so time is frozen mid-afternoon to prove
// they use the start or the end of the day and not the current moment
describe("dashboard queries", () => {
  const START_OF_TODAY = "2024-06-15T00:00:00.000Z";
  const END_OF_TODAY = "2024-06-15T23:59:59.999Z";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T15:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getBookingsAfterDate", () => {
    it("returns bookings created between the given date and the end of today", async () => {
      const bookings = [{ created_at: "2024-06-10", totalPrice: 500 }];
      supabaseFake.resolveNext({ data: bookings });

      const result = await getBookingsAfterDate("2024-06-08T15:30:00.000Z");

      expect(result).toEqual(bookings);

      const [query] = supabaseFake.queries;
      expect(query.table).toBe("bookings");
      expect(query.calls).toContainEqual([
        "gte",
        "created_at",
        "2024-06-08T15:30:00.000Z",
      ]);
      // End of day, or bookings created later today would be left out
      expect(query.calls).toContainEqual(["lte", "created_at", END_OF_TODAY]);
    });

    it("throws when supabase returns an error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      supabaseFake.resolveNext({ error: { message: "fail" } });

      await expect(getBookingsAfterDate("2024-06-08")).rejects.toThrow(
        "Bookings could not get loaded",
      );
    });
  });

  describe("getStaysAfterDate", () => {
    it("returns stays starting between the given date and today", async () => {
      const stays = [{ id: "1", startDate: "2024-06-10" }];
      supabaseFake.resolveNext({ data: stays });

      const result = await getStaysAfterDate("2024-06-08T15:30:00.000Z");

      expect(result).toEqual(stays);

      const [query] = supabaseFake.queries;
      expect(query.table).toBe("bookings");
      expect(query.calls).toContainEqual([
        "gte",
        "startDate",
        "2024-06-08T15:30:00.000Z",
      ]);
      // Start of day, so stays that only begin tomorrow are left out
      expect(query.calls).toContainEqual(["lte", "startDate", START_OF_TODAY]);
    });

    it("throws when supabase returns an error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      supabaseFake.resolveNext({ error: { message: "fail" } });

      await expect(getStaysAfterDate("2024-06-08")).rejects.toThrow(
        "Bookings could not get loaded",
      );
    });
  });

  describe("getStaysTodayActivity", () => {
    it("asks for today's arrivals and today's departures only", async () => {
      const activity = [{ id: "1", status: "unconfirmed" }];
      supabaseFake.resolveNext({ data: activity });

      const result = await getStaysTodayActivity();

      expect(result).toEqual(activity);

      const [query] = supabaseFake.queries;
      expect(query.table).toBe("bookings");

      const [filter] = argsOf(query, "or") as [string];
      // Arriving: not checked in yet and starting today
      expect(filter).toContain(
        `and(status.eq.unconfirmed,startDate.eq.${START_OF_TODAY})`,
      );
      // Leaving: checked in and ending today
      expect(filter).toContain(
        `and(status.eq.checked-in,endDate.eq.${START_OF_TODAY})`,
      );
      expect(query.calls).toContainEqual(["order", "created_at"]);
    });

    it("throws when supabase returns an error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      supabaseFake.resolveNext({ error: { message: "fail" } });

      await expect(getStaysTodayActivity()).rejects.toThrow(
        "Bookings could not get loaded",
      );
    });
  });
});

// ─────────────────────────────────────────────
// updateBooking
// ─────────────────────────────────────────────
describe("updateBooking", () => {
  it("sends the updates for the given booking and returns the result", async () => {
    const updated = { id: "5", status: "checked-in" };
    supabaseFake.resolveNext({ data: updated });

    const result = await updateBooking("5", { status: "checked-in" });

    expect(result).toEqual(updated);

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("bookings");
    expect(query.calls).toContainEqual(["update", { status: "checked-in" }]);
    expect(query.calls).toContainEqual(["eq", "id", "5"]);
  });

  it("throws when update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "fail" } });

    await expect(updateBooking("5", {})).rejects.toThrow(
      "Booking could not be updated",
    );
  });
});

// ─────────────────────────────────────────────
// deleteBooking
// ─────────────────────────────────────────────
describe("deleteBooking", () => {
  it("deletes the given booking", async () => {
    await expect(deleteBooking("10")).resolves.toBeUndefined();

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("bookings");
    expect(query.calls).toContainEqual(["delete"]);
    expect(query.calls).toContainEqual(["eq", "id", "10"]);
  });

  it("throws when delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "fail" } });

    await expect(deleteBooking("10")).rejects.toThrow(
      "Booking could not be deleted",
    );
  });
});
