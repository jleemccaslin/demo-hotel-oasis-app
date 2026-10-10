// Breakfast is charged per guest, per night
export function calcBreakfastPrice(
  breakfastPrice: number,
  numNights: number,
  numGuests: number,
) {
  return breakfastPrice * numNights * numGuests;
}
