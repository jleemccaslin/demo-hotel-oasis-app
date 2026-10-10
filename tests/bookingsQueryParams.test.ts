import { describe, it, expect } from "vitest";
import {
  getBookingsQueryParams,
  getPagesToPrefetch,
} from "../src/features/bookings/bookingsQueryParams";

// ─────────────────────────────────────────────
// getBookingsQueryParams
// ─────────────────────────────────────────────
describe("getBookingsQueryParams", () => {
  it("defaults to no filter, newest start date first, page 1", () => {
    expect(getBookingsQueryParams(new URLSearchParams())).toEqual({
      filter: null,
      sortBy: { field: "startDate", direction: "desc" },
      page: 1,
    });
  });

  it("filters on the status in the URL", () => {
    const { filter } = getBookingsQueryParams(
      new URLSearchParams("status=checked-in"),
    );

    expect(filter).toEqual({ field: "status", value: "checked-in" });
  });

  it("treats the status 'all' as no filter", () => {
    const { filter } = getBookingsQueryParams(
      new URLSearchParams("status=all"),
    );

    expect(filter).toBeNull();
  });

  it("splits sortBy into field and direction", () => {
    const { sortBy } = getBookingsQueryParams(
      new URLSearchParams("sortBy=totalPrice-asc"),
    );

    expect(sortBy).toEqual({ field: "totalPrice", direction: "asc" });
  });

  it("reads the page as a number", () => {
    const { page } = getBookingsQueryParams(new URLSearchParams("page=3"));

    expect(page).toBe(3);
  });

  // The page comes straight from the address bar, so it can be anything
  it.each(["0", "-1", "1.5", "abc", ""])(
    "falls back to page 1 for the invalid page '%s'",
    (value) => {
      const { page } = getBookingsQueryParams(
        new URLSearchParams({ page: value }),
      );

      expect(page).toBe(1);
    },
  );

  it("reads all three together", () => {
    const params = new URLSearchParams(
      "status=unconfirmed&sortBy=startDate-asc&page=2",
    );

    expect(getBookingsQueryParams(params)).toEqual({
      filter: { field: "status", value: "unconfirmed" },
      sortBy: { field: "startDate", direction: "asc" },
      page: 2,
    });
  });
});

// ─────────────────────────────────────────────
// getPagesToPrefetch
// ─────────────────────────────────────────────
describe("getPagesToPrefetch", () => {
  it("returns both neighbours of a middle page", () => {
    expect(getPagesToPrefetch(3, 5).sort((a, b) => a - b)).toEqual([2, 4]);
  });

  it("returns only the next page on the first page", () => {
    expect(getPagesToPrefetch(1, 5)).toEqual([2]);
  });

  it("returns only the previous page on the last page", () => {
    expect(getPagesToPrefetch(5, 5)).toEqual([4]);
  });

  it("returns nothing when there is a single page", () => {
    expect(getPagesToPrefetch(1, 1)).toEqual([]);
  });

  it("returns nothing when there are no bookings at all", () => {
    expect(getPagesToPrefetch(1, 0)).toEqual([]);
  });
});
