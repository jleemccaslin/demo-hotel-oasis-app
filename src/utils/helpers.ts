import { differenceInDays, formatDistance, parseISO } from "date-fns";

// We want to make this function work for both Date objects and strings which from Supabase
export const subtractDates = (date1: string, date2: string) =>
  differenceInDays(parseISO(String(date1)), parseISO(String(date2)));

export const formatDistanceFromNow = (date: string) =>
  formatDistance(parseISO(date), new Date(), {
    addSuffix: true,
  })
    .replace("about ", "")
    // Only the leading "in" of a future date, not the one inside "minutes"
    .replace(/^in /, "In ");

// Supabase needs an ISO date string. However, that string will be different on every render because the MS or SEC have changed, so we use this to remove any time difference
export const getToday = function (options: any = {}) {
  const today = new Date();

  // This is necessary to compare with created_at from Supabase, because it is not at 0.0.0.0, so we need to set the date to be END of the day when we compare it with earlier dates
  if (options?.end)
    // Set to the last second of the day
    today.setUTCHours(23, 59, 59, 999);
  else today.setUTCHours(0, 0, 0, 0);
  return today.toISOString();
};

// A number in the URL can be anything the user typed into the address bar. Anything that is not a whole number of 1 or more falls back to the default
const parsePositiveInt = (value: string | null, fallback: number) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
};

// Everything that needs the current page reads it through here, so the table and the pagination footer can never disagree
export const getPageParam = (searchParams: URLSearchParams) =>
  parsePositiveInt(searchParams.get("page"), 1);

// The dashboard period in days, e.g. ?last=30
export const getNumDaysParam = (searchParams: URLSearchParams) =>
  parsePositiveInt(searchParams.get("last"), 7);

export const formatCurrency =(value: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(
    value,
  );
