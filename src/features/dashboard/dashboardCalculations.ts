import { format, isSameDay } from "date-fns";
import { BookingInterface } from "../../types/interfaces";

//============ TYPES ==============
export interface ChartDataObject {
  duration: string;
  value: number;
  color: string;
}

interface SalesBooking {
  created_at: string | Date;
  totalPrice: number;
  extrasPrice: number;
}

//============ STATS ==============
export function calcSales(bookings: Pick<BookingInterface, "totalPrice">[]) {
  return bookings.reduce((acc, cur) => acc + cur.totalPrice, 0);
}

// Nights that were actually stayed, out of all the nights that could have been sold (every cabin, every day of the period)
export function calcOccupancyRate(
  confirmedStays: Pick<BookingInterface, "numNights">[],
  numDays: number,
  cabinCount: number,
) {
  const availableNights = numDays * cabinCount;

  // Without cabins there is nothing to occupy, and dividing by zero would show "NaN%"
  if (availableNights <= 0) return 0;

  return (
    confirmedStays.reduce((acc, cur) => acc + cur.numNights, 0) /
    availableNights
  );
}

//============ SALES CHART ==============
// One point on the chart per date, so a day without bookings still shows up as 0 instead of leaving a gap
export function calcDailySales(dates: Date[], bookings: SalesBooking[]) {
  return dates.map((date) => {
    const bookingsOnDate = bookings.filter((booking) =>
      isSameDay(date, new Date(booking.created_at)),
    );

    return {
      label: format(date, "MMM dd"),
      totalSales: bookingsOnDate.reduce((acc, cur) => acc + cur.totalPrice, 0),
      extrasSales: bookingsOnDate.reduce(
        (acc, cur) => acc + cur.extrasPrice,
        0,
      ),
    };
  });
}

//============ DURATION CHART ==============
export function prepareDurationData(
  startData: ChartDataObject[],
  stays: Pick<BookingInterface, "numNights">[],
) {
  function incArrayValue(arr: ChartDataObject[], field: string) {
    return arr.map((obj) =>
      obj.duration === field ? { ...obj, value: obj.value + 1 } : obj,
    );
  }

  const data: ChartDataObject[] = stays
    .reduce((arr, cur) => {
      const num = cur.numNights;
      if (num === 1) return incArrayValue(arr, "1 night");
      if (num === 2) return incArrayValue(arr, "2 nights");
      if (num === 3) return incArrayValue(arr, "3 nights");
      if ([4, 5].includes(num)) return incArrayValue(arr, "4-5 nights");
      if ([6, 7].includes(num)) return incArrayValue(arr, "6-7 nights");
      if (num >= 8 && num <= 14) return incArrayValue(arr, "8-14 nights");
      if (num >= 15 && num <= 21) return incArrayValue(arr, "15-21 nights");
      if (num >= 21) return incArrayValue(arr, "21+ nights");
      return arr;
    }, startData)
    .filter((obj) => obj.value > 0);

  return data;
}
