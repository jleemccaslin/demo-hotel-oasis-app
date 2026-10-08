import { isFuture, isPast, isToday } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { subtractDates } from "../utils/helpers";

import { bookings } from "./data-bookings";
import { cabins } from "./data-cabins";
import { guests } from "./data-guests";

// Takes the Supabase client as a parameter so this runs both in the browser
// (Uploader) and on the server (the demo-login Netlify Function)

async function deleteGuests(supabase: SupabaseClient) {
  const { error } = await supabase.from("guests").delete().gt("id", 0);
  if (error) throw new Error(`Deleting guests: ${error.message}`);
}

async function deleteCabins(supabase: SupabaseClient) {
  const { error } = await supabase.from("cabins").delete().gt("id", 0);
  if (error) throw new Error(`Deleting cabins: ${error.message}`);
}

async function deleteBookings(supabase: SupabaseClient) {
  const { error } = await supabase.from("bookings").delete().gt("id", 0);
  if (error) throw new Error(`Deleting bookings: ${error.message}`);
}

async function createGuests(supabase: SupabaseClient) {
  const { error } = await supabase.from("guests").insert(guests);
  if (error) throw new Error(`Creating guests: ${error.message}`);
}

async function createCabins(supabase: SupabaseClient) {
  const { error } = await supabase.from("cabins").insert(cabins);
  if (error) throw new Error(`Creating cabins: ${error.message}`);
}

async function createBookings(supabase: SupabaseClient) {
  // Bookings need a guestID and a cabinID. We can't tell Supabase IDs for each object; it will calculate them on its own. So it might be different for different people, especially after multiple uploads. Therefore, we need to first get all guestIDs and cabinIDs, and then replace the original IDs in the booking data with the actual ones from the DB
  const { data: guestsIDs } = await supabase
    .from("guests")
    .select("id")
    .order("id");
  const allGuestIDs = guestsIDs?.map((cabin) => cabin.id);
  const { data: cabinsIDs } = await supabase
    .from("cabins")
    .select("id")
    .order("id");
  const allCabinIDs = cabinsIDs?.map((cabin) => cabin.id);

  const finalBookings = bookings.map((booking) => {
    // Here relying on the order of cabins, as they don't have and ID yet
    const cabin = cabins.at(booking.cabinID - 1)!;
    const numNights = subtractDates(booking.endDate, booking.startDate);
    const cabinPrice = numNights * (cabin.regularPrice - cabin.discount);
    const extrasPrice = booking.hasBreakfast
      ? numNights * 15 * booking.numGuests
      : 0; // hardcoded breakfast price
    const totalPrice = cabinPrice + extrasPrice;

    let status;
    if (
      isPast(new Date(booking.endDate)) &&
      !isToday(new Date(booking.endDate))
    )
      status = "checked-out";
    if (
      isFuture(new Date(booking.startDate)) ||
      isToday(new Date(booking.startDate))
    )
      status = "unconfirmed";
    if (
      (isFuture(new Date(booking.endDate)) ||
        isToday(new Date(booking.endDate))) &&
      isPast(new Date(booking.startDate)) &&
      !isToday(new Date(booking.startDate))
    )
      status = "checked-in";

    return {
      ...booking,
      numNights,
      cabinPrice,
      extrasPrice,
      totalPrice,
      guestID: allGuestIDs?.at(booking.guestID - 1),
      cabinID: allCabinIDs?.at(booking.cabinID - 1),
      status,
    };
  });

  const { error } = await supabase.from("bookings").insert(finalBookings);
  if (error) throw new Error(`Creating bookings: ${error.message}`);
}

export async function resetAllTestData(supabase: SupabaseClient) {
  // Bookings need to be deleted FIRST
  await deleteBookings(supabase);
  await deleteGuests(supabase);
  await deleteCabins(supabase);

  // Bookings need to be created LAST
  await createGuests(supabase);
  await createCabins(supabase);
  await createBookings(supabase);
}

export async function resetBookings(supabase: SupabaseClient) {
  await deleteBookings(supabase);
  await createBookings(supabase);
}
