export interface BookingInterface {
  id: string;
  created_at: Date;
  startDate: string;
  endDate: string;
  numNights: number;
  numGuests: number;
  status: "unconfirmed" | "checked-in" | "checked-out";
  cabinPrice?: number;
  totalPrice: number;
  extrasPrice?: number;
  hasBreakfast?: boolean;
  isPaid?: boolean;
  observations?: string;
  cabins: {
    name?: string;
  };
  guests: {
    fullName: string;
    email: string;
    country?: string;
    nationality?: string;
    nationalID?: string;
    countryFlag?: string;
  };
}

export interface CabinInterface {
  id?: string;
  name: string;
  maxCapacity: number;
  regularPrice: number;
  discount: number;
  description?: string;
  image?: any;
}

export interface GuestInterface {
  id?: number;
  created_at?: Date;
  fullName?: string;
  email?: string;
  nationalID?: string;
  nationality?: string;
  countryFlag?: string;
}

export interface SettingsInterface {
  id?: number;
  created_at?: string;
  minBookingLength?: number;
  maxBookingLength?: number;
  maxGuestsPerBooking?: number;
  breakfastPrice?: 20;
}

export interface UserInterface {
  user: {
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
}
