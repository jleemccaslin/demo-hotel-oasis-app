import supabase, { supabaseUrl } from "./supabase";

export async function getCabins() {
  const { data, error } = await supabase.from("cabins").select("*");

  if (error) {
    console.error("Cabins could not be loaded");
    throw new Error("");
  }

  return data;
}

export async function deleteCabin(id: string) {
  const { error } = await supabase.from("cabins").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Cabin could not be deleted");
  }
}

interface CabinData {
  name: string;
  maxCapacity: number;
  regularPrice: number;
  discount: number;
  description: string;
  image: string | File;
}

function isFile(image: string | File): image is File {
  return image instanceof File;
}

export async function createOrUpdateCabin(newCabin: CabinData, id: string) {
  // Tells us if image already existed (editing session, user did not update image)
  const hasImagePath =
    typeof newCabin.image === "string" &&
    newCabin.image.startsWith(supabaseUrl);

  const imageName = isFile(newCabin.image)
    ? `${Math.random()}-${newCabin.image.name}`.replaceAll("/", "")
    : "";

  const imagePath = hasImagePath
    ? (newCabin.image as string)
    : `${supabaseUrl}/storage/v1/object/public/cabin-images/${imageName}`;

  const cabinPayload = {
    ...newCabin,
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
    throw new Error("Cabin could not be created");
  }

  // 2. Upload Image
  if (hasImagePath) return data;

  const { error: storageError } = await supabase.storage
    .from("cabin-images")
    .upload(imageName, newCabin.image);

  // 3. Delete cabin if there was an error uploading the image
  if (storageError) {
    await supabase.from("cabins").delete().eq("id", data.id);
    console.error(storageError);
    throw new Error(
      "Cabin image could not be uploaded and the cabin was not created",
    );
  }

  return data;
}
