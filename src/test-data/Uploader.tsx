import { useState } from "react";
import supabase from "../services/supabase";
import Button from "../ui/Button";
import { resetAllTestData, resetBookings } from "./resetTestData";
import { useDarkMode } from "../context/DarkModeContext";

// const originalSettings = {
//   minBookingLength: 3,
//   maxBookingLength: 30,
//   maxGuestsPerBooking: 10,
//   breakfastPrice: 15,
// };

function Uploader() {
  const { isDarkMode } = useDarkMode();
  const [isLoading, setIsLoading] = useState(false);

  async function uploadAll() {
    setIsLoading(true);
    try {
      await resetAllTestData(supabase);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadBookings() {
    setIsLoading(true);
    try {
      await resetBookings(supabase);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "auto",
        backgroundColor: `${isDarkMode ? "" : "#EFEFEF"}`,
        padding: "8px",
        borderRadius: "5px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <h3>Upload test data</h3>

      <Button
        onClick={uploadAll}
        disabled={isLoading}
        $size="medium"
        $variation="primary"
      >
        Cabins/Bookings
      </Button>

      <Button
        onClick={uploadBookings}
        disabled={isLoading}
        $size="medium"
        $variation="primary"
      >
        Bookings ONLY
      </Button>
    </div>
  );
}

export default Uploader;
