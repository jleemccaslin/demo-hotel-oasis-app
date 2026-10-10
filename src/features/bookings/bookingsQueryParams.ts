import { getPageParam } from "../../utils/helpers";

// Turns the bookings page URL (?status=...&sortBy=...&page=...) into the options getBookings expects
export function getBookingsQueryParams(searchParams: URLSearchParams) {
  // FILTER
  const filterValue = searchParams.get("status");
  const filter =
    !filterValue || filterValue === "all"
      ? null
      : { field: "status", value: filterValue };

  // SORT
  const sortByRaw = searchParams.get("sortBy") || "startDate-desc";
  const [field, direction] = sortByRaw.split("-");
  const sortBy = { field, direction };

  // PAGINATION
  const page = getPageParam(searchParams);

  return { filter, sortBy, page };
}

// The pages next to the current one, so they can be loaded ahead of time and paging feels instant
export function getPagesToPrefetch(page: number, pageCount: number) {
  const pages: number[] = [];

  if (page < pageCount) pages.push(page + 1);
  if (page > 1) pages.push(page - 1);

  return pages;
}
