import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  subtractDates,
  formatDistanceFromNow,
  getToday,
  formatCurrency,
  getPageParam,
  getNumDaysParam,
} from "./../src/utils/helpers";

// ─────────────────────────────────────────────
// subtractDates
// ─────────────────────────────────────────────
describe("subtractDates", () => {
  // The date maths itself belongs to date-fns. What is ours is the argument
  // order: first date minus second date
  it("subtracts the second date from the first", () => {
    expect(subtractDates("2024-01-20", "2024-01-15")).toBe(5);
    expect(subtractDates("2024-01-15", "2024-01-20")).toBe(-5);
  });
});

// ─────────────────────────────────────────────
// formatDistanceFromNow
// ─────────────────────────────────────────────
// We freeze time here so the output of formatDistance is predictable.
// Without this, the test result would change every second the test runs.
describe("formatDistanceFromNow", () => {
  beforeEach(() => {
    // Tell vitest to use fake timers and lock "now" to a fixed point in time
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T12:00:00.000Z"));
  });

  afterEach(() => {
    // Always restore real timers after each test so other tests aren't affected
    vi.useRealTimers();
  });

  it("formats a past date with 'ago' suffix", () => {
    const result = formatDistanceFromNow("2024-05-01T12:00:00.000Z");
    // date-fns will output "about 1 month ago", and our helper strips "about "
    expect(result).toBe("1 month ago");
  });

  it("formats a future date with capital 'In' prefix", () => {
    const result = formatDistanceFromNow("2024-07-01T12:00:00.000Z");
    // date-fns outputs "in about 1 month", our helper replaces "in" → "In"
    // and strips "about "
    expect(result).toBe("In 1 month");
  });

  it("only capitalises the leading 'in', not one inside a later word", () => {
    const result = formatDistanceFromNow("2024-06-01T12:20:00.000Z");
    expect(result).toBe("In 20 minutes");
  });

  it("leaves words containing 'in' untouched for past dates", () => {
    expect(formatDistanceFromNow("2024-06-01T11:55:00.000Z")).toBe(
      "5 minutes ago",
    );
    expect(formatDistanceFromNow("2024-06-01T11:59:50.000Z")).toBe(
      "less than a minute ago",
    );
  });

  it("formats a date 3 days ago correctly", () => {
    const result = formatDistanceFromNow("2024-05-29T12:00:00.000Z");
    expect(result).toBe("3 days ago");
  });
});

// ─────────────────────────────────────────────
// getToday
// ─────────────────────────────────────────────
describe("getToday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T15:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns start of day (midnight UTC) by default", () => {
    const result = getToday();
    expect(result).toBe("2024-06-15T00:00:00.000Z");
  });

  it("returns end of day when options.end is true", () => {
    const result = getToday({ end: true });
    expect(result).toBe("2024-06-15T23:59:59.999Z");
  });
});

// ─────────────────────────────────────────────
// getPageParam / getNumDaysParam
// ─────────────────────────────────────────────
// Both read a number the user can type into the address bar, so the invalid
// cases matter as much as the valid ones
const invalidNumbers = ["0", "-1", "1.5", "abc", "", "Infinity"];

describe("getPageParam", () => {
  it("reads the page from the URL", () => {
    expect(getPageParam(new URLSearchParams("page=3"))).toBe(3);
  });

  it("is page 1 when the URL has no page", () => {
    expect(getPageParam(new URLSearchParams())).toBe(1);
  });

  it.each(invalidNumbers)("is page 1 for the invalid page '%s'", (value) => {
    expect(getPageParam(new URLSearchParams({ page: value }))).toBe(1);
  });
});

describe("getNumDaysParam", () => {
  it("reads the number of days from the URL", () => {
    expect(getNumDaysParam(new URLSearchParams("last=30"))).toBe(30);
  });

  it("is 7 days when the URL has no period", () => {
    expect(getNumDaysParam(new URLSearchParams())).toBe(7);
  });

  it.each(invalidNumbers)("is 7 days for the invalid period '%s'", (value) => {
    expect(getNumDaysParam(new URLSearchParams({ last: value }))).toBe(7);
  });
});

// ─────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────
describe("formatCurrency", () => {
  // The formatting itself belongs to Intl. What is ours is the configuration:
  // US dollars, English separators, two decimals
  it("formats as US dollars with thousands separators and cents", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });
});
