import { UseMutateFunction } from "@tanstack/react-query";
import Button from "../../ui/Button";
import { useCheckout } from "./useCheckout";
import { BookingInterface } from "../../types/interfaces";

//============ TYPES =============
interface CheckoutButtonProps {
  bookingID: string;
}

interface Checkout {
  checkout: UseMutateFunction<BookingInterface, unknown, string, unknown>;
  isCheckingOut: boolean;
}

//============ MAIN COMPONENT =============
function CheckoutButton({ bookingID }: CheckoutButtonProps) {
  const { checkout, isCheckingOut }: Checkout = useCheckout();

  return (
    <Button
      $variation="primary"
      $size="small"
      onClick={() => {
        checkout(bookingID);
      }}
      disabled={isCheckingOut}
    >
      Check out
    </Button>
  );
}

export default CheckoutButton;
