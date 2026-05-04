import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Spinner from "@/components/Spinner";
import { ReactSortable } from "react-sortablejs";
import {
  buildProductPayload,
  getPropertiesToFill,
  validateProductInput,
} from "@/lib/products";

export default function ProductForm({
  _id,
  title: existingTitle,
  description: existingDescription,
  price: existingPrice,
  images: existingImages,
  category: assignedCategory,
  properties: assignedProperties,
  quantity: existingQuantity,
  availabilityMode: existingAvailabilityMode,
  availableLocations: existingAvailableLocations,
}) {
  const [title, setTitle] = useState(existingTitle || "");
  const [description, setDescription] = useState(existingDescription || "");
  const [category, setCategory] = useState(assignedCategory || "");
  const [productProperties, setProductProperties] = useState(
    assignedProperties || {}
  );
  const [price, setPrice] = useState(existingPrice || "");
  const [quantity, setQuantity] = useState(
    existingQuantity === undefined || existingQuantity === null
      ? ""
      : String(existingQuantity)
  );
  const [images, setImages] = useState(existingImages || []);
  const [isOnlineOnly, setIsOnlineOnly] = useState(
    !existingAvailabilityMode || existingAvailabilityMode === "online_only"
  );
  const [locations, setLocations] = useState([]);
  const [availableLocations, setAvailableLocations] = useState(
    Array.isArray(existingAvailableLocations)
      ? existingAvailableLocations.map(String)
      : []
  );
  const [goToProducts, setGoToProducts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [categories, setCategories] = useState([]);
  const [brokenImages, setBrokenImages] = useState({});
  const router = useRouter();

  useEffect(() => {
    axios.get("/api/categories").then((result) => {
      setCategories(result.data);
    });
    axios.get("/api/locations").then((result) => {
      setLocations(Array.isArray(result.data) ? result.data : []);
    });
  }, []);

  async function saveProduct(ev) {
    ev.preventDefault();
    setFormError("");

    const validationError = validateProductInput({ title, price });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const normalizedAvailabilityMode =
      isOnlineOnly || availableLocations.length === 0
        ? "online_only"
        : availableLocations.length === 1
          ? "single_location"
          : "multiple_locations";

    const data = buildProductPayload({
      title,
      description,
      price,
      quantity,
      images,
      category,
      properties: productProperties,
      availabilityMode: normalizedAvailabilityMode,
      availableLocations: isOnlineOnly ? [] : availableLocations,
    });

    try {
      setIsSaving(true);
      if (_id) {
        await axios.put("/api/products", { ...data, _id });
      } else {
        await axios.post("/api/products", data);
      }
      setGoToProducts(true);
    } catch (error) {
      const apiError =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to save product.";
      setFormError(apiError);
    } finally {
      setIsSaving(false);
    }
  }

  if (goToProducts) {
    router.push("/products");
  }

  async function uploadImages(ev) {
    const files = ev.target?.files;
    if (files?.length > 0) {
      setFormError("");
      setIsUploading(true);
      const data = new FormData();
      for (const file of files) {
        data.append("file", file);
      }
      try {
        const res = await axios.post("/api/upload", data);
        setImages((oldImages) => {
          return [...oldImages, ...res.data.links];
        });
      } catch (error) {
        const apiError =
          error?.response?.data?.error ||
          error?.message ||
          "Failed to upload image.";
        setFormError(apiError);
      } finally {
        setIsUploading(false);
      }
    }
  }

  function updateImagesOrder(images) {
    setImages(images);
  }

  function removeImage(imageToRemove) {
    setImages((currentImages) =>
      currentImages.filter((image) => image !== imageToRemove)
    );
    setBrokenImages((current) => {
      if (!current[imageToRemove]) return current;
      const next = { ...current };
      delete next[imageToRemove];
      return next;
    });
  }

  function setProductProp(propName, value) {
    setProductProperties((prev) => {
      const newProductProps = { ...prev };
      newProductProps[propName] = value;
      return newProductProps;
    });
  }

  function handleAvailabilitySelectionChange(ev) {
    const selectedValues = Array.from(ev.target.selectedOptions).map(
      (option) => option.value
    );

    if (selectedValues.includes("online_only")) {
      setIsOnlineOnly(true);
      setAvailableLocations([]);
      return;
    }

    setIsOnlineOnly(false);
    setAvailableLocations(selectedValues);
  }

  const propertiesToFill = getPropertiesToFill(categories, category);
  const titleId = "product-title";
  const categoryId = "product-category";
  const descriptionId = "product-description";
  const priceId = "product-price";
  const quantityId = "product-quantity";
  const photosId = "product-photos";

  return (
    <form onSubmit={saveProduct} aria-describedby={formError ? "product-form-error" : undefined}>
      <label htmlFor={titleId}>Product name</label>
      <input
        id={titleId}
        type="text"
        placeholder="product name"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
        required
      />
      <label htmlFor={categoryId}>Category</label>
      <select id={categoryId} value={category} onChange={(ev) => setCategory(ev.target.value)}>
        <option value="">Uncategorized</option>
        {categories.length > 0 &&
          categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
      </select>
      {propertiesToFill.length > 0 &&
        propertiesToFill.map((p) => (
            <div key={p.name} className="">
              <label htmlFor={`property-${p.name}`}>
                {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
              </label>
              <div>
                <select
                  id={`property-${p.name}`}
                  value={productProperties[p.name]}
                  onChange={(ev) => setProductProp(p.name, ev.target.value)}
                >
                  {(Array.isArray(p.values) ? p.values : []).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
      <label htmlFor={photosId}>Photos</label>
      <div className="mb-2 flex flex-wrap gap-1">
        <ReactSortable
          list={images}
          className="flex flex-wrap gap-1"
          setList={updateImagesOrder}
        >
          {!!images?.length &&
            images.map((link) => (
              <div
                key={link}
                className="relative h-24 bg-white p-4 shadow-sm rounded-sm border border-gray-200"
              >
                <button
                  type="button"
                  onClick={() => removeImage(link)}
                  className="absolute right-1 top-1 rounded bg-white/90 px-2 py-1 text-xs font-medium text-red-600 shadow-sm border border-red-100 hover:bg-red-50"
                  aria-label="Usuń grafikę produktu"
                >
                  Usuń
                </button>
                {brokenImages[link] ? (
                  <div className="image-fallback" aria-label="Nie udało się załadować podglądu zdjęcia">
                    Brak podglądu
                  </div>
                ) : (
                  <img
                    src={link}
                    alt={`Podgląd zdjęcia produktu ${title || ""}`.trim()}
                    className="image-preview"
                    width={96}
                    height={96}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={() =>
                      setBrokenImages((current) => ({
                        ...current,
                        [link]: true,
                      }))
                    }
                  />
                )}
              </div>
            ))}
        </ReactSortable>
        {isUploading && (
          <div className="h-24 flex items-center">
            <Spinner />
          </div>
        )}
        <label htmlFor={photosId} className="w-24 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <div>Add image</div>
          <input id={photosId} type="file" onChange={uploadImages} className="hidden" multiple />
        </label>
      </div>
      <label htmlFor={descriptionId}>Description</label>
      <textarea
        id={descriptionId}
        placeholder="description"
        value={description}
        onChange={(ev) => setDescription(ev.target.value)}
      />
      <label htmlFor={priceId}>Price (in PLN)</label>
      <input
        id={priceId}
        type="number"
        placeholder="price"
        value={price}
        onChange={(ev) => setPrice(ev.target.value)}
        min="0.01"
        step="0.01"
        required
      />
      <label htmlFor={quantityId}>Quantity (stock limit)</label>
      <input
        id={quantityId}
        type="number"
        placeholder="quantity"
        value={quantity}
        onChange={(ev) => setQuantity(ev.target.value)}
        min="0"
        step="1"
      />
      <label htmlFor="availability-selection">Dostępność produktu</label>
      <div className="location-picker">
        <select
          id="availability-selection"
          multiple
          size={Math.min(Math.max(locations.length + 1, 4), 8)}
          value={isOnlineOnly ? ["online_only"] : availableLocations}
          onChange={handleAvailabilitySelectionChange}
        >
          <option value="online_only">Online only</option>
          {locations.map((location) => (
            <option key={location._id} value={String(location._id)}>
              {location.name}
              {location.city ? ` | ${location.city}` : ""}
              {location.addressLine1 ? ` | ${location.addressLine1}` : ""}
            </option>
          ))}
        </select>
        {locations.length === 0 && (
          <p className="location-hint">
            Nie masz jeszcze dodanych lokalizacji. Uzupełnij je najpierw w sekcji Locations.
          </p>
        )}
      </div>
      {formError && <p id="product-form-error" className="form-error" role="alert">{formError}</p>}
      <button type="submit" className="btn-primary" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>
      <style jsx>{`
        .form-error {
          color: #dc2626;
          margin-bottom: 10px;
        }

        .location-picker {
          display: grid;
          gap: 10px;
          margin-bottom: 18px;
        }

        .location-picker :global(select) {
          min-height: 160px;
        }

        .location-hint {
          color: #4b5563;
          font-size: 0.92rem;
        }

        .image-preview,
        .image-fallback {
          width: 96px;
          height: 96px;
          border-radius: 8px;
        }

        .image-preview {
          object-fit: contain;
          display: block;
          background: #fff;
        }

        .image-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 0.75rem;
          color: #6b7280;
          background: #f3f4f6;
          border: 1px dashed #d1d5db;
          padding: 8px;
        }
      `}</style>
    </form>
  );
}
