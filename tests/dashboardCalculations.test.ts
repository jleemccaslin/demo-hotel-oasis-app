import { describe, it, expect } from "vitest";
import {
  calcSales,
  calcOccupancyRate,
  calcDailySales,
  prepareDurationData,
} from "../src/features/dashboard/dashboardCalculations";

// ─────────────────────────────────────────────
// calcSales
// ─────────────────────────────────────────────
describe("calcSales", () => {
  it("adds up the total price of every booking", () => {
    const bookings = [{ totalPrice: 250 }, { totalPrice: 1200.5 }];
    expect(calcSales(bookings)).toBe(1450.5);
  });

  it("is 0 when there are no bookings", () => {
    expect(calcSales([])).toBe(0);
  });
});

// ─────────────────────────────────────────────
// calcOccupancyRate
// ─────────────────────────────────────────────
describe("calcOccupancyRate", () => {
  it("divides nights stayed by the nights available across all cabins", () => {
    const stays = [{ numNights: 3 }, { numNights: 4 }];
    // 7 nights stayed out of 7 days x 2 cabins = 14 available
    expect(calcOccupancyRate(stays, 7, 2)).toBe(0.5);
  });

  it("is 0 when nobody stayed", () => {
    expect(calcOccupancyRate([], 30, 8)).toBe(0);
  });

  // Dividing by zero would put "NaN%" or "Infinity%" on the dashboard
  it("is 0 when there are no cabins to occupy", () => {
    expect(calcOccupancyRate([], 30, 0)).toBe(0);
    expect(calcOccupancyRate([{ numNights: 3 }], 30, 0)).toBe(0);
  });
});

// ─────────────────────────────────────────────
// calcDailySales
// ─────────────────────────────────────────────
describe("calcDailySales", () => {
  // Built in local time, like the dates the chart passes in, so the test
  // gives the same answer in every timezone
  const june14 = new Date(2024, 5, 14);
  const june15 = new Date(2024, 5, 15);
  const june16 = new Date(2024, 5, 16);

  const bookingAt = (date: Date, totalPrice: number, extrasPrice: number) => ({
    created_at: date.toISOString(),
    totalPrice,
    extrasPrice,
  });

  it("adds up total and extras sales per day", () => {
    const bookings = [
      bookingAt(new Date(2024, 5, 14, 9), 500, 50),
      bookingAt(new Date(2024, 5, 14, 22), 300, 0),
      bookingAt(new Date(2024, 5, 15, 12), 1000, 120),
    ];

    expect(calcDailySales([june14, june15], bookings)).toEqual([
      { label: "Jun 14", totalSales: 800, extrasSales: 50 },
      { label: "Jun 15", totalSales: 1000, extrasSales: 120 },
    ]);
  });

  it("keeps a day without bookings as 0, so the chart has no gap", () => {
    const bookings = [bookingAt(new Date(2024, 5, 16, 12), 400, 40)];

    expect(calcDailySales([june14, june15, june16], bookings)).toEqual([
      { label: "Jun 14", totalSales: 0, extrasSales: 0 },
      { label: "Jun 15", totalSales: 0, extrasSales: 0 },
      { label: "Jun 16", totalSales: 400, extrasSales: 40 },
    ]);
  });

  it("leaves out bookings from outside the given dates", () => {
    const bookings = [bookingAt(new Date(2024, 5, 13, 12), 999, 99)];

    expect(calcDailySales([june14], bookings)).toEqual([
      { label: "Jun 14", totalSales: 0, extrasSales: 0 },
    ]);
  });
});

// ─────────────────────────────────────────────
// prepareDurationData
// ─────────────────────────────────────────────
describe("prepareDurationData", () => {
  const durations = [
    "1 night",
    "2 nights",
    "3 nights",
    "4-5 nights",
    "6-7 nights",
    "8-14 nights",
    "15-21 nights",
    "21+ nights",
  ];
  const startData = durations.map((duration, i) => ({
    duration,
    value: 0,
    color: `#00000${i}`,
  }));

  // Both edges of every bucket, which is where an off-by-one would hide
  it.each([
    [1, "1 night"],
    [2, "2 nights"],
    [3, "3 nights"],
    [4, "4-5 nights"],
    [5, "4-5 nights"],
    [6, "6-7 nights"],
    [7, "6-7 nights"],
    [8, "8-14 nights"],
    [14, "8-14 nights"],
    [15, "15-21 nights"],
    [21, "15-21 nights"],
    [22, "21+ nights"],
    [90, "21+ nights"],
  ])("puts a %i night stay in the '%s' bucket", (numNights, duration) => {
    const data = prepareDurationData(startData, [{ numNights }]);

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ duration, value: 1 });
  });

  it("counts every stay that falls in the same bucket", () => {
    const stays = [{ numNights: 4 }, { numNights: 5 }, { numNights: 2 }];

    expect(prepareDurationData(startData, stays)).toEqual([
      { duration: "2 nights", value: 1, color: "#000001" },
      { duration: "4-5 nights", value: 2, color: "#000003" },
    ]);
  });

  it("leaves out buckets with no stays, so the chart has no empty slices", () => {
    expect(prepareDurationData(startData, [])).toEqual([]);
  });

  it("ignores stays without any nights", () => {
    expect(prepareDurationData(startData, [{ numNights: 0 }])).toEqual([]);
  });

  it("does not modify the start data it was given", () => {
    prepareDurationData(startData, [{ numNights: 1 }, { numNights: 1 }]);

    // The start data is shared between renders. Counting into it directly
    // would make the totals grow on every render
    expect(startData.every((bucket) => bucket.value === 0)).toBe(true);
  });
});
