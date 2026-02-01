import { useForm } from "react-hook-form";

import { useCreateCabin } from "./useCreateCabin";
import { useUpdateCabin } from "./useUpdateCabin";

import Form from "../../ui/Form";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import FileInput from "../../ui/FileInput";
import { CabinData } from "../../services/apiCabins";

//============ TYPES =============
export interface Cabin extends CabinData {
  id?: string;
  image: FileList | string; // FileList for new uploads, string for existing
}

interface CreateCabinFormOptions {
  cabinToUpdate?: Cabin | Record<string, never>;
  onCloseModal?: () => void;
}

//============ MAIN COMPONENT =============
function CreateCabinForm({
  cabinToUpdate = {},
  onCloseModal,
}: CreateCabinFormOptions) {
  const { isCreating, createCabin } = useCreateCabin();
  const { isUpdating, updateCabin } = useUpdateCabin();
  const isWorking = isCreating || isUpdating;

  // If this is an updating session, these two consts are given new values
  const { id: updateID, ...updateValues } = cabinToUpdate;
  const isUpdateSession = Boolean(updateID);

  const { register, handleSubmit, reset, getValues, formState } = useForm({
    defaultValues: isUpdateSession ? updateValues : {},
  });
  const { errors } = formState;

  function onSubmit(data: Cabin) {
    const image = typeof data.image === "string" ? data.image : data.image[0];

    if (isUpdateSession) {
      updateCabin(
        {
          newCabinData: { ...data, image },
          id: updateID,
        },
        {
          onSuccess: (data) => {
            reset();
            onCloseModal?.();
          },
        },
      );
    } else
      createCabin(
        {
          newCabinData: { ...data, image },
        },
        {
          onSuccess: (data) => {
            reset();
            onCloseModal?.();
          },
        },
      );
  }

  const requiredMessage = "This field is required";

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      type={onCloseModal ? "modal" : "regular"}
    >
      <FormRow label="Cabin name" error={errors?.name?.message}>
        <Input
          type="text"
          id="name"
          disabled={isWorking}
          {...register("name", { required: requiredMessage })}
        />
      </FormRow>

      <FormRow label="Maximum capacity" error={errors?.maxCapacity?.message}>
        <Input
          type="number"
          id="maxCapacity"
          disabled={isWorking}
          {...register("maxCapacity", {
            valueAsNumber: true,
            required: requiredMessage,
            min: {
              value: 1,
              message: "Capacity should be at least 1.",
            },
          })}
        />
      </FormRow>

      <FormRow label="Regular price" error={errors?.regularPrice?.message}>
        <Input
          type="number"
          id="regularPrice"
          disabled={isWorking}
          {...register("regularPrice", {
            valueAsNumber: true,
            required: requiredMessage,
            min: {
              value: 1,
              message: "Price should be at least 1.",
            },
          })}
        />
      </FormRow>

      <FormRow label="Discount" error={errors?.discount?.message}>
        <Input
          type="number"
          id="discount"
          defaultValue="0"
          disabled={isWorking}
          {...register("discount", {
            valueAsNumber: true,
            validate: (value) =>
              value < getValues().regularPrice ||
              "Discount should be less than the regular price",
          })}
        />
      </FormRow>

      <FormRow
        label="Description for website"
        error={errors?.description?.message}
      >
        <Textarea
          type="text"
          id="description"
          defaultValue=""
          disabled={isWorking}
          {...register("description", { required: requiredMessage })}
        />
      </FormRow>

      <FormRow label="Cabin photo">
        <FileInput
          id="image"
          accept="image/*"
          disabled={isWorking}
          {...register("image", {
            required: isUpdateSession ? false : "This field is required",
          })}
        />
      </FormRow>

      <FormRow>
        <>
          <Button
            $variation="secondary"
            type="reset"
            onClick={() => onCloseModal?.()}
          >
            Cancel
          </Button>
          <Button disabled={isWorking}>
            {isUpdateSession ? "Update cabin" : "Create new cabin"}
          </Button>
        </>
      </FormRow>
    </Form>
  );
}

export default CreateCabinForm;
