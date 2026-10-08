import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../ui/Button";
import Form from "../../ui/Form";
import Input from "../../ui/Input";
import FormRowVertical from "../../ui/FormRowVertical";
import SpinnerMini from "../../ui/SpinnerMini";
import LoadingOverlay from "../../ui/LoadingOverlay";
import { useLogin } from "./useLogin";
import { useDemoLogin } from "./useDemoLogin";

function LoginForm() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("user") === "demo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading: isLoggingIn } = useLogin();
  const { loginDemo, isLoading: isLoggingInDemo } = useDemoLogin();
  const isLoading = isLoggingIn || isLoggingInDemo;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !password) return;

    login(
      { email, password },
      {
        onSettled: () => {
          setEmail("");
          setPassword("");
        },
      },
    );
  }

  return (
    <>
      {isLoggingInDemo && <LoadingOverlay message="Preparing demo data…" />}
      <Form onSubmit={handleSubmit}>
        <FormRowVertical label="Email address">
          <Input
            type="email"
            id="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </FormRowVertical>
        <FormRowVertical label="Password">
          <Input
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </FormRowVertical>
        <FormRowVertical>
          <Button
            $size="large"
            disabled={isLoading}
            $variation={isDemo ? "secondary" : "primary"}
          >
            {!isLoggingIn ? "Login" : <SpinnerMini />}
          </Button>
        </FormRowVertical>
        {isDemo && (
          <FormRowVertical>
            <Button
              type="button"
              $variation="primary"
              $size="large"
              disabled={isLoading}
              onClick={() => loginDemo()}
            >
              {!isLoggingInDemo ? "Log in as demo user" : <SpinnerMini />}
            </Button>
          </FormRowVertical>
        )}
      </Form>
    </>
  );
}

export default LoginForm;
