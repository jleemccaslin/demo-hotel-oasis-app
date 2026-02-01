import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createOrUpdateCabin } from "../../services/apiCabins";

interface MutationOptions {
  newCabinData: any;
  id: string | undefined;
}

export function useUpdateCabin() {
  const queryClient = useQueryClient();

  const { mutate: updateCabin, isLoading: isUpdating } = useMutation({
    mutationFn: ({ newCabinData, id }: MutationOptions) =>
      createOrUpdateCabin({ newCabinData, id }),
    onSuccess: () => {
      toast.success("Cabin successfully updated");
      queryClient.invalidateQueries(["cabins"]);
    },
    onError: (error: any) => toast.error(error.message),
  });

  return { isUpdating, updateCabin };
}
