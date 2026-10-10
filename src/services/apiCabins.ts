import supabase, { supabaseUrl } from "./supabase";
import { CabinInterface } from "../types/interfaces";

//============ TYPES ==============

interface CreateOrUpdateCabinOptions {
  newCabinData: CabinInterface;
  id?: string;
}

//============ API FUNCTIONS ==============
export async function getCabins() {
  const { data, error } = await supabase.from("cabins").select("*");

  if (error) {
    console.error(error);
    throw new Error("Cabins could not be loaded");
  }

  return data;
}

export async function deleteCabin(id: string) {
  if (id === "") return;

  const { error } = await supabase.from("cabins").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Cabin could not be deleted");
  }
}

function isFile(image: string | File): image is File {
  return image instanceof File;
}

export async function createOrUpdateCabin({
  newCabinData,
  id,
}: CreateOrUpdateCabinOptions) {
  // Tells us if image already existed (editing session, user did not update image)
  const hasImagePath =
    typeof newCabinData.image === "string" &&
    newCabinData.image.startsWith(supabaseUrl);

  const imageName = isFile(newCabinData.image)
    ? `${Math.random()}-${newCabinData.image.name}`.replaceAll("/", "")
    : "";

  const imagePath = hasImagePath
    ? (newCabinData.image as string)
    : `${supabaseUrl}/storage/v1/object/public/cabin-images/${imageName}`;

  const cabinPayload = {
    ...newCabinData,
    image: imagePath,
  };

  // 1. Create/Edit Cabin

  const { data, error } = id
    ? await supabase
        .from("cabins")
        .update(cabinPayload)
        .eq("id", id)
        .select()
        .single()
    : await supabase.from("cabins").insert([cabinPayload]).select().single();

  if (error) {
    console.error(error);
    throw new Error(`Cabin could not be ${id ? "updated" : "created"}`);
  }

  // 2. Upload Image
  if (hasImagePath) return data;

  const { error: storageError } = await supabase.storage
    .from("cabin-images")
    .upload(imageName, newCabinData.image);

  // 3. Delete cabin if there was an error uploading the image, but only if we just created it. An edited cabin already existed and must be kept
  if (storageError) {
    console.error(storageError);

    if (id)
      throw new Error("Cabin was updated but the image could not be uploaded");

    await supabase.from("cabins").delete().eq("id", data.id);
    throw new Error(
      "Cabin image could not be uploaded and the cabin was not created",
    );
  }

  return data;
}
