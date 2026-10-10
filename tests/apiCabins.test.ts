import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCabins,
  deleteCabin,
  createOrUpdateCabin,
} from "../src/services/apiCabins";
import { supabaseFake, argsOf, FAKE_SUPABASE_URL } from "./supabaseFake";

vi.mock("../src/services/supabase", async () => {
  const { supabaseFake, FAKE_SUPABASE_URL } = await import("./supabaseFake");
  return { default: supabaseFake.client, supabaseUrl: FAKE_SUPABASE_URL };
});

const IMAGE_BUCKET_URL = `${FAKE_SUPABASE_URL}/storage/v1/object/public/cabin-images`;

beforeEach(() => {
  supabaseFake.reset();
});

// ─────────────────────────────────────────────
// getCabins
// ─────────────────────────────────────────────
describe("getCabins", () => {
  it("returns cabin data on success", async () => {
    const cabins = [{ id: "1", name: "Cabin A" }];
    supabaseFake.resolveNext({ data: cabins });

    const result = await getCabins();

    expect(result).toEqual(cabins);

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("cabins");
    expect(query.calls).toContainEqual(["select", "*"]);
  });

  it("throws when supabase returns an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "fail" } });

    await expect(getCabins()).rejects.toThrow("Cabins could not be loaded");
  });
});

// ─────────────────────────────────────────────
// deleteCabin
// ─────────────────────────────────────────────
describe("deleteCabin", () => {
  it("does nothing when called with an empty id", async () => {
    await deleteCabin("");

    expect(supabaseFake.queries).toHaveLength(0);
  });

  it("deletes the given cabin", async () => {
    await deleteCabin("42");

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("cabins");
    expect(query.calls).toContainEqual(["delete"]);
    expect(query.calls).toContainEqual(["eq", "id", "42"]);
  });

  it("throws when supabase returns an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "fail" } });

    await expect(deleteCabin("42")).rejects.toThrow(
      "Cabin could not be deleted",
    );
  });
});

// ─────────────────────────────────────────────
// createOrUpdateCabin
// ─────────────────────────────────────────────
describe("createOrUpdateCabin", () => {
  const baseCabin = {
    name: "Forest Lodge",
    maxCapacity: 4,
    regularPrice: 250,
    discount: 0,
  };

  it("creates a new cabin when no id is provided", async () => {
    const returnedData = { id: "new-1", ...baseCabin };
    supabaseFake.resolveNext({ data: returnedData });

    const result = await createOrUpdateCabin({
      newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
    });

    expect(result).toEqual(returnedData);

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("cabins");
    expect(query.calls).toContainEqual([
      "insert",
      [{ ...baseCabin, image: expect.stringContaining(IMAGE_BUCKET_URL) }],
    ]);
  });

  it("stores the image URL of the exact file it uploads", async () => {
    const image = new File(["img"], "photo.jpg");
    supabaseFake.resolveNext({ data: { id: "new-1", ...baseCabin } });

    await createOrUpdateCabin({ newCabinData: { ...baseCabin, image } });

    const [upload] = supabaseFake.uploads;
    expect(upload.bucket).toBe("cabin-images");
    expect(upload.file).toBe(image);

    // If these two drift apart, the cabin points at an image that isn't there
    const [[payload]] = argsOf(supabaseFake.queries[0], "insert") as [
      [{ image: string }],
    ];
    expect(payload.image).toBe(`${IMAGE_BUCKET_URL}/${upload.path}`);
  });

  it("strips slashes from the uploaded file name", async () => {
    supabaseFake.resolveNext({ data: { id: "new-1", ...baseCabin } });

    await createOrUpdateCabin({
      newCabinData: {
        ...baseCabin,
        image: new File(["img"], "summer/photo.jpg"),
      },
    });

    // A slash would make Supabase storage treat part of the name as a folder
    const [upload] = supabaseFake.uploads;
    expect(upload.path).not.toContain("/");
    expect(upload.path).toMatch(/summerphoto\.jpg$/);
  });

  it("updates an existing cabin when id is provided", async () => {
    const returnedData = { id: "existing-1", ...baseCabin };
    supabaseFake.resolveNext({ data: returnedData });

    const result = await createOrUpdateCabin({
      newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
      id: "existing-1",
    });

    expect(result).toEqual(returnedData);

    const [query] = supabaseFake.queries;
    expect(query.table).toBe("cabins");
    expect(query.calls).toContainEqual([
      "update",
      { ...baseCabin, image: expect.stringContaining(IMAGE_BUCKET_URL) },
    ]);
    expect(query.calls).toContainEqual(["eq", "id", "existing-1"]);
    expect(query.calls.map(([method]) => method)).not.toContain("insert");
  });

  it("keeps the image and skips the upload when it is already a supabase URL", async () => {
    const imageUrl = `${IMAGE_BUCKET_URL}/photo.jpg`;
    supabaseFake.resolveNext({
      data: { id: "1", ...baseCabin, image: imageUrl },
    });

    await createOrUpdateCabin({
      newCabinData: { ...baseCabin, image: imageUrl },
      id: "1",
    });

    expect(supabaseFake.uploads).toHaveLength(0);

    const [query] = supabaseFake.queries;
    expect(query.calls).toContainEqual([
      "update",
      { ...baseCabin, image: imageUrl },
    ]);
  });

  it("throws without uploading when cabin creation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "Database error" } });

    await expect(
      createOrUpdateCabin({
        newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
      }),
    ).rejects.toThrow("Cabin could not be created");

    expect(supabaseFake.uploads).toHaveLength(0);
  });

  it("throws without uploading when cabin update fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ error: { message: "Database error" } });

    await expect(
      createOrUpdateCabin({
        newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
        id: "existing-1",
      }),
    ).rejects.toThrow("Cabin could not be updated");

    expect(supabaseFake.uploads).toHaveLength(0);
  });

  it("deletes the new cabin and throws when image upload fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ data: { id: "new-1", ...baseCabin } });
    supabaseFake.resolveNextUpload({ error: { message: "File storage fail" } });

    await expect(
      createOrUpdateCabin({
        newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
      }),
    ).rejects.toThrow("Cabin image could not be uploaded");

    // Verify cleanup happened
    const [, cleanup] = supabaseFake.queries;
    expect(cleanup.table).toBe("cabins");
    expect(cleanup.calls).toContainEqual(["delete"]);
    expect(cleanup.calls).toContainEqual(["eq", "id", "new-1"]);
  });

  it("keeps an existing cabin when image upload fails during an update", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFake.resolveNext({ data: { id: "existing-1", ...baseCabin } });
    supabaseFake.resolveNextUpload({ error: { message: "File storage fail" } });

    await expect(
      createOrUpdateCabin({
        newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
        id: "existing-1",
      }),
    ).rejects.toThrow("Cabin was updated but the image could not be uploaded");

    const methods = supabaseFake.queries.flatMap((query) =>
      query.calls.map(([method]) => method),
    );
    expect(methods).not.toContain("delete");
  });
});
