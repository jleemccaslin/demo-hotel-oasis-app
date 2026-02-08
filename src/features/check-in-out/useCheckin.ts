import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBooking } from "../../services/apiBookings";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface Breakfast {
  hasBreakfast: boolean;
  extrasPrice: number;
  totalPrice: number;
}

interface MutationOptions {
  bookingID: string;
  breakfast: Breakfast | Record<string, never>;
}

export function useCheckin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: checkin, isLoading: isCheckingIn } = useMutation({
    mutationFn: ({ bookingID, breakfast }: MutationOptions) =>
      updateBooking(bookingID, {
        status: "checked-in",
        isPaid: true,
        ...breakfast,
      }),

    onSuccess: (data) => {
      toast.success(`Booking #${data.id} successfully checked in`);
      queryClient.invalidateQueries({ type: "active" });
      navigate(`/bookings/${data.id}`);
    },

    onError: (error) => toast.error(`There was an error while checking in`),
  });

  return { checkin, isCheckingIn };
}
