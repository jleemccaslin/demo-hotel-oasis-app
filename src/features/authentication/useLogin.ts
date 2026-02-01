import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login as loginAPI } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

//============ TYPES ==============
interface MutationOptions {
  email: string;
  password: string;
}

//============ QUERY ==============
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: login, isLoading } = useMutation({
    mutationFn: ({ email, password }: MutationOptions) =>
      loginAPI({ email, password }),
    onSuccess: (data: any) => {
      queryClient.setQueryData(["user"], data.user);
      toast.success("Login successful");
      navigate("/dashboard", { replace: true });
    },
    onError: (error: any) => {
      toast.error(`${error.message}: ${error.cause.message}`);
    },
  });

  return { login, isLoading };
}
