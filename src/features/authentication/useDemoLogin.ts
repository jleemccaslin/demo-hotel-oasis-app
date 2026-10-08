import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginDemo as loginDemoAPI } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

//============ QUERY ==============
export function useDemoLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: loginDemo, isLoading } = useMutation({
    mutationFn: loginDemoAPI,
    onSuccess: (data: any) => {
      // The demo data may have just been reset, so drop anything cached
      // before login and let the dashboard fetch fresh data
      queryClient.removeQueries();
      queryClient.setQueryData(["user"], data.user);
      toast.success("Login successful");
      navigate("/dashboard", { replace: true });
    },
    onError: (error: Error) => {
      toast.error(`${error.message}`);
    },
  });

  return { loginDemo, isLoading };
}
