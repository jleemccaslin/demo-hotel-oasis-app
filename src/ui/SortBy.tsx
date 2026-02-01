import { useSearchParams } from "react-router-dom";
import Select from "./Select";

// ============ TYPES ============
interface Option {
  value: string;
  label: string;
}

interface SortByProps {
  options: Option[];
}

// ============ MAIN COMPONENT ============
function SortBy({ options }: SortByProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    searchParams.set("sortBy", e.target.value);
    setSearchParams(searchParams);
  }

  return (
    <Select
      options={options}
      type="white"
      onChange={handleChange}
      value={sortBy}
    />
  );
}

export default SortBy;
