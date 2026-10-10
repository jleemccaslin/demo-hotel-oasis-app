import { describe, it, expect } from "vitest";
import { calcBreakfastPrice } from "../src/features/check-in-out/breakfastPrice";

describe("calcBreakfastPrice", () => {
  it("charges every guest for every night", () => {
    // 15 per breakfast x 3 nights x 2 guests
    expect(calcBreakfastPrice(15, 3, 2)).toBe(90);
  });
});
