import { HiOutlineBriefcase, HiOutlineChartBar } from "react-icons/hi";
import { HiOutlineBanknotes, HiOutlineCalendarDays } from "react-icons/hi2";
import Stat from "./Stat";
import { formatCurrency } from "../../utils/helpers";
import { BookingInterface } from "../../types/interfaces";

interface RecentBookings {
  created_at: Date;
  totalPrice: number;
  extrasPrice: number;
}

interface StatsOptions {
  bookings: RecentBookings[];
  confirmedStays: BookingInterface[];
  cabinCount: number;
  numDays: number;
}

function Stats({
  bookings,
  confirmedStays,
  numDays,
  cabinCount,
}: StatsOptions) {
  const numBookings = bookings.length;
  const sales = bookings.reduce(
    (acc: number, cur: RecentBookings) => acc + cur.totalPrice,
    0,
  );
  const checkins = confirmedStays.length;
  const occupancyRate =
    confirmedStays.reduce((acc, cur) => acc + cur.numNights, 0) /
    (numDays * cabinCount);

  return (
    <>
      <Stat
        title={"Bookings"}
        color="blue"
        icon={<HiOutlineBriefcase />}
        value={numBookings}
      />
      <Stat
        title={"Sales"}
        color="green"
        icon={<HiOutlineBanknotes />}
        value={formatCurrency(sales)}
      />
      <Stat
        title={"Checkins"}
        color="indigo"
        icon={<HiOutlineCalendarDays />}
        value={String(checkins)}
      />
      <Stat
        title={"Occupancy rate"}
        color="yellow"
        icon={<HiOutlineChartBar />}
        value={Math.round(occupancyRate * 100) + "%"}
      />
    </>
  );
}

export default Stats;
