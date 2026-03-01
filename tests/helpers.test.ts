import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  subtractDates,
  formatDistanceFromNow,
  getToday,
  formatCurrency,
} from "./../src/utils/helpers";

// ─────────────────────────────────────────────
// subtractDates
// ─────────────────────────────────────────────
describe("subtractDates", () => {
  it("returns 0 when both dates are the same", () => {
    const result = subtractDates("2024-01-15", "2024-01-15");
    expect(result).toBe(0);
  });

  it("returns a positive number when dateStr1 is later than dateStr2", () => {
    // Jan 20 minus Jan 15 = 5 days
    const result = subtractDates("2024-01-20", "2024-01-15");
    expect(result).toBe(5);
  });

  it("returns a negative number when dateStr1 is earlier than dateStr2", () => {
    // Jan 10 minus Jan 15 = -5 days
    const result = subtractDates("2024-01-10", "2024-01-15");
    expect(result).toBe(-5);
  });

  it("handles dates across different months", () => {
    // Feb 5 minus Jan 15 = 21 days
    const result = subtractDates("2024-02-05", "2024-01-15");
    expect(result).toBe(21);
  });

  it("handles dates across different years", () => {
    // Jan 1 2025 minus Jan 1 2024 = 366 days (2024 is a leap year)
    const result = subtractDates("2025-01-01", "2024-01-01");
    expect(result).toBe(366);
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
    expect(result).toContain("In");
    expect(result).not.toContain("in"); // lowercase "in" should be gone
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

  it("returns an ISO string", () => {
    const result = getToday();
    // A valid ISO string can always be parsed back into a non-NaN Date
    expect(new Date(result).toString()).not.toBe("Invalid Date");
  });

  it("returns start of day (midnight UTC) by default", () => {
    const result = getToday();
    expect(result).toBe("2024-06-15T00:00:00.000Z");
  });

  it("returns end of day when options.end is true", () => {
    const result = getToday({ end: true });
    expect(result).toBe("2024-06-15T23:59:59.999Z");
  });

  it("start-of-day and end-of-day results are on the same calendar date", () => {
    const start = getToday();
    const end = getToday({ end: true });
    // Both should begin with the same YYYY-MM-DD prefix
    expect(start.slice(0, 10)).toBe(end.slice(0, 10));
  });
});

// ─────────────────────────────────────────────
// formatCurrency
// ─────────────────────────────────────────────
describe("formatCurrency", () => {
  it("formats a whole dollar amount", () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });

  it("formats a value with cents", () => {
    expect(formatCurrency(9.99)).toBe("$9.99");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("formats negative values (e.g. refunds)", () => {
    expect(formatCurrency(-49.5)).toBe("-$49.50");
  });
});
