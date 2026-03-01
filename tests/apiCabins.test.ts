import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCabins,
  deleteCabin,
  createOrUpdateCabin,
} from "../src/services/apiCabins";

// ─────────────────────────────────────────────
// Mock Supabase
// ─────────────────────────────────────────────
const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();
const mockUpload = vi.fn();

vi.mock("../src/services/supabase", () => {
  const supabaseUrl = "https://test.supabase.co";

  return {
    supabaseUrl,
    default: {
      from: vi.fn((table: string) => {
        if (table === "cabins") {
          return {
            select: mockSelect,
            delete: mockDelete,
            insert: mockInsert,
            update: mockUpdate,
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
        })),
      },
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// getCabins
// ─────────────────────────────────────────────
describe("getCabins", () => {
  it("returns cabin data on success", async () => {
    const cabins = [{ id: "1", name: "Cabin A" }];
    mockSelect.mockResolvedValue({ data: cabins, error: null });

    const result = await getCabins();
    expect(result).toEqual(cabins);
    expect(mockSelect).toHaveBeenCalledWith("*");
  });

  it("throws when supabase returns an error", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "fail" } });

    await expect(getCabins()).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// deleteCabin
// ─────────────────────────────────────────────
describe("deleteCabin", () => {
  it("does nothing when called with an empty id", async () => {
    await deleteCabin("");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("calls supabase delete with the correct id", async () => {
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    await deleteCabin("42");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "42");
  });

  it("throws when supabase returns an error", async () => {
    mockEq.mockResolvedValue({ error: { message: "fail" } });
    mockDelete.mockReturnValue({ eq: mockEq });

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
    mockSingle.mockResolvedValue({ data: returnedData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpload.mockResolvedValue({ error: null });

    const result = await createOrUpdateCabin({
      newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(result).toEqual(returnedData);
  });

  it("updates an existing cabin when id is provided", async () => {
    const returnedData = { id: "existing-1", ...baseCabin };
    mockSingle.mockResolvedValue({ data: returnedData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockUpload.mockResolvedValue({ error: null });

    const result = await createOrUpdateCabin({
      newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
      id: "existing-1",
    });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "existing-1");
    expect(result).toEqual(returnedData);
  });

  it("skips image upload when image is already a supabase URL", async () => {
    const imageUrl =
      "https://test.supabase.co/storage/v1/object/public/cabin-images/photo.jpg";
    const returnedData = { id: "1", ...baseCabin, image: imageUrl };
    mockSingle.mockResolvedValue({ data: returnedData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    await createOrUpdateCabin({
      newCabinData: { ...baseCabin, image: imageUrl },
    });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("throws when cabin creation fails", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    await expect(
      createOrUpdateCabin({
        newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
      }),
    ).rejects.toThrow("Cabin could not be created");
  });

  it("deletes cabin and throws when image upload fails", async () => {
    const returnedData = { id: "new-1", ...baseCabin };
    mockSingle.mockResolvedValue({ data: returnedData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpload.mockResolvedValue({ error: { message: "File storage fail" } });

    // Mock the cleanup delete call
    mockEq.mockResolvedValue({ error: null });
    mockDelete.mockReturnValue({ eq: mockEq });

    await expect(
      createOrUpdateCabin({
        newCabinData: { ...baseCabin, image: new File(["img"], "photo.jpg") },
      }),
    ).rejects.toThrow("Cabin image could not be uploaded");

    // Verify cleanup happened
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "new-1");
  });
});
