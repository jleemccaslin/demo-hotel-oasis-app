import Button from "../../ui/Button";
import { useCheckout } from "./useCheckout";

//============ TYPES =============
interface CheckoutButtonProps {
  bookingID: string | void;
}

interface Checkout {
  checkout: any;
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
