import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookings } from "../../services/apiBookings";
import { useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../../utils/constants";
import {
  getBookingsQueryParams,
  getPagesToPrefetch,
} from "./bookingsQueryParams";

export function useBookings() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // FILTER, SORT, PAGINATION
  const { filter, sortBy, page } = getBookingsQueryParams(searchParams);

  // QUERY
  const {
    isLoading,
    data: { data: bookings, count } = {},
    error,
  } = useQuery({
    queryKey: ["bookings", filter, sortBy, page],
    queryFn: () => getBookings({ filter, sortBy, page }),
  });

  // PRE-FETCHING PREV/NEXT PAGES
  if (count === undefined || count === null) {
    return { isLoading, error, bookings };
  }

  const pageCount = Math.ceil(count / PAGE_SIZE);

  // The same page number goes into the key and the fetch, so a page can never be cached under another page's key
  getPagesToPrefetch(page, pageCount).forEach((adjacentPage) =>
    queryClient.prefetchQuery({
      queryKey: ["bookings", filter, sortBy, adjacentPage],
      queryFn: () => getBookings({ filter, sortBy, page: adjacentPage }),
    }),
  );

  return { isLoading, error, bookings, count };
}
