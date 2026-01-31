import { useForm } from "react-hook-form";

import { useSignup } from "./useSignup";

import Button from "../../ui/Button";
import Form from "../../ui/Form";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";

interface OnSubmitProps {
  fullName?: string;
  email?: string;
  password?: string;
}

function SignupForm() {
  const { signup, isLoading } = useSignup();
  const { register, formState, getValues, handleSubmit, reset } = useForm();
  const { errors } = formState;

  function onSubmit({ fullName, email, password }: OnSubmitProps) {
    if (fullName === undefined || email === undefined || password === undefined)
      return;

    signup(
      { fullName, email, password },
      {
        onSettled: () => reset(),
      },
    );
  }

  const requiredMessage = "This field is required";

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormRow label="Full name" error={errors?.fullName?.message}>
        <Input
          type="text"
          id="fullName"
          disabled={isLoading}
          {...register("fullName", { required: requiredMessage })}
        />
      </FormRow>

      <FormRow label="Email address" error={errors?.email?.message}>
        <Input
          type="email"
          id="email"
          disabled={isLoading}
          {...register("email", {
            required: requiredMessage,
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Please provide a valid email address",
            },
          })}
        />
      </FormRow>

      <FormRow
        label="Password (min 8 characters)"
        error={errors?.password?.message}
      >
        <Input
          type="password"
          id="password"
          disabled={isLoading}
          {...register("password", {
            required: requiredMessage,
            minLength: {
              value: 8,
              message: "Passwords need a minimum of 8 characters",
            },
          })}
        />
      </FormRow>

      <FormRow label="Repeat password" error={errors?.passwordConfirm?.message}>
        <Input
          type="password"
          id="passwordConfirm"
          disabled={isLoading}
          {...register("passwordConfirm", {
            required: requiredMessage,
            validate: (value) =>
              value === getValues().password || "Passwords need to match",
          })}
        />
      </FormRow>

      <FormRow>
        <>
          <Button
            $variation="secondary"
            type="reset" // HTML Attribute, not for Styled Components
            disabled={isLoading}
            onClick={reset}
          >
            Reset form
          </Button>
          <Button disabled={isLoading}>Create new user</Button>
        </>
      </FormRow>
    </Form>
  );
}

export default SignupForm;
