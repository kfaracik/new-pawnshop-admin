import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Spinner from "@/components/Spinner";
import { ReactSortable } from "react-sortablejs";

export default function ProductForm({
  _id,
  title: existingTitle,
  description: existingDescription,
  price: existingPrice,
  images: existingImages,
  category: assignedCategory,
  properties: assignedProperties,
  isAuction: existingIsAuction,
  auctionLink: existingAuctionLink,
  quantity: existingQuantity,
}) {
  const [isAuction, setIsAuction] = useState(false || existingIsAuction);
  const [auctionLink, setAuctionLink] = useState("" || existingAuctionLink);
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
  const [goToProducts, setGoToProducts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [categories, setCategories] = useState([]);
  const [auctionConfig, setAuctionConfig] = useState({
    startAt: "",
    endAt: "",
    startPrice: "",
    minIncrement: "",
  });
  const [auctionId, setAuctionId] = useState("");
  const [auctionStatus, setAuctionStatus] = useState("");
  const [isAuctionLoading, setIsAuctionLoading] = useState(false);
  const [isAuctionSaving, setIsAuctionSaving] = useState(false);
  const [auctionError, setAuctionError] = useState("");
  const [auctionMessage, setAuctionMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    axios.get("/api/categories").then((result) => {
      setCategories(result.data);
    });
  }, []);

  function toDatetimeLocal(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - tzOffset);
    return local.toISOString().slice(0, 16);
  }

  const fetchProductAuction = useCallback(async () => {
    if (!_id || !isAuction) return;
    setIsAuctionLoading(true);
    setAuctionError("");
    try {
      const response = await axios.get("/api/auctions", {
        params: { productId: _id },
      });
      const auctions = Array.isArray(response.data) ? response.data : [];
      const auction = auctions[0];
      if (!auction) {
        setAuctionId("");
        setAuctionStatus("");
        setAuctionConfig({
          startAt: "",
          endAt: "",
          startPrice: "",
          minIncrement: "",
        });
        return;
      }
      setAuctionId(auction._id || auction.id || "");
      setAuctionStatus(auction.status || "");
      setAuctionConfig({
        startAt: toDatetimeLocal(auction.startAt),
        endAt: toDatetimeLocal(auction.endAt),
        startPrice: String(auction.startPrice ?? ""),
        minIncrement: String(auction.minIncrement ?? ""),
      });
    } catch (error) {
      setAuctionError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to load auction config."
      );
    } finally {
      setIsAuctionLoading(false);
    }
  }, [_id, isAuction]);

  useEffect(() => {
    fetchProductAuction();
  }, [fetchProductAuction]);

  async function saveProduct(ev) {
    ev.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (price === "" || Number(price) <= 0 || Number.isNaN(Number(price))) {
      setFormError("Price must be a number greater than 0.");
      return;
    }

    if (isAuction && !auctionLink.trim()) {
      setFormError("Auction link is required when product is marked as auction.");
      return;
    }

    const data = {
      title: title.trim(),
      description,
      price,
      quantity,
      images,
      category,
      properties: productProperties,
      isAuction,
      auctionLink: isAuction ? auctionLink.trim() : null,
    };

    try {
      setIsSaving(true);
      if (_id) {
        //update
        await axios.put("/api/products", { ...data, _id });
      } else {
        //create
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

  function setProductProp(propName, value) {
    setProductProperties((prev) => {
      const newProductProps = { ...prev };
      newProductProps[propName] = value;
      return newProductProps;
    });
  }

  async function saveAuctionConfiguration() {
    if (!_id) {
      setAuctionError("Save product first, then configure auction.");
      return;
    }
    setAuctionError("");
    setAuctionMessage("");
    if (!auctionConfig.startAt || !auctionConfig.endAt) {
      setAuctionError("Start and end date are required.");
      return;
    }
    if (
      auctionConfig.startPrice === "" ||
      auctionConfig.minIncrement === "" ||
      Number(auctionConfig.startPrice) < 0 ||
      Number(auctionConfig.minIncrement) < 0
    ) {
      setAuctionError("Start price and min increment must be valid numbers.");
      return;
    }

    const payload = {
      productId: _id,
      startAt: new Date(auctionConfig.startAt).toISOString(),
      endAt: new Date(auctionConfig.endAt).toISOString(),
      startPrice: Number(auctionConfig.startPrice),
      minIncrement: Number(auctionConfig.minIncrement),
    };

    try {
      setIsAuctionSaving(true);
      if (auctionId) {
        await axios.put(`/api/auctions/${auctionId}`, payload);
        setAuctionMessage("Auction updated.");
      } else {
        await axios.post("/api/auctions", payload);
        setAuctionMessage("Auction created.");
      }
      await fetchProductAuction();
    } catch (error) {
      setAuctionError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to save auction configuration."
      );
    } finally {
      setIsAuctionSaving(false);
    }
  }

  async function closeAuction() {
    if (!auctionId) return;
    setAuctionError("");
    setAuctionMessage("");
    try {
      await axios.post(`/api/auctions/${auctionId}/close`, {});
      setAuctionMessage("Auction closed.");
      await fetchProductAuction();
    } catch (error) {
      setAuctionError(
        error?.response?.data?.error || error?.message || "Failed to close auction."
      );
    }
  }

  const propertiesToFill = [];
  if (categories.length > 0 && category) {
    let catInfo = categories.find(({ _id }) => _id === category);
    propertiesToFill.push(...catInfo.properties);
    while (catInfo?.parent?._id) {
      const parentCat = categories.find(
        ({ _id }) => _id === catInfo?.parent?._id
      );
      propertiesToFill.push(...parentCat.properties);
      catInfo = parentCat;
    }
  }

  return (
    <form onSubmit={saveProduct}>
      <label>Product name</label>
      <input
        type="text"
        placeholder="product name"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
        required
      />
      <label>Category</label>
      <select value={category} onChange={(ev) => setCategory(ev.target.value)}>
        <option value="">Uncategorized</option>
        {categories.length > 0 &&
          categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
      </select>
      {propertiesToFill.length > 0 &&
        propertiesToFill
          .filter((p) => p && typeof p.name === "string" && p.name.length > 0)
          .map((p) => (
          <div key={p.name} className="">
            <label>{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</label>
            <div>
              <select
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
      <label>Photos</label>
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
                className="h-24 bg-white p-4 shadow-sm rounded-sm border border-gray-200"
              >
                <img src={link} alt="" className="rounded-lg" />
              </div>
            ))}
        </ReactSortable>
        {isUploading && (
          <div className="h-24 flex items-center">
            <Spinner />
          </div>
        )}
        <label className="w-24 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
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
          <input type="file" onChange={uploadImages} className="hidden" />
        </label>
      </div>
      <label>Description</label>
      <textarea
        placeholder="description"
        value={description}
        onChange={(ev) => setDescription(ev.target.value)}
      />
      <label>Price (in PLN)</label>
      <input
        type="number"
        placeholder="price"
        value={price}
        onChange={(ev) => setPrice(ev.target.value)}
        min="0.01"
        step="0.01"
        required
      />
      <label>Quantity (stock limit)</label>
      <input
        type="number"
        placeholder="quantity"
        value={quantity}
        onChange={(ev) => setQuantity(ev.target.value)}
        min="0"
        step="1"
      />
      <label className="switch-container">
        <span>Is Auction</span>
        <div className="switch">
          <input
            type="checkbox"
            checked={isAuction}
            onChange={(ev) => setIsAuction(ev.target.checked)}
          />
          <span className="slider"></span>
        </div>
      </label>
      {isAuction && (
        <>
          <label>Auction Link</label>
          <input
            type="url"
            placeholder="Enter auction link"
            value={auctionLink}
            onChange={(ev) => setAuctionLink(ev.target.value)}
            required={isAuction}
          />
          <div id="auction-config" className="bg-gray-50 border rounded-md p-3 mb-3">
            <h3 className="font-semibold mb-2">Auction Configuration</h3>
            {!_id && (
              <p className="text-orange-700 mb-2">
                Save product first, then configure auction schedule.
              </p>
            )}
            {_id && isAuctionLoading && <p>Loading auction config...</p>}
            {auctionStatus && (
              <p className="mb-2">
                Current status: <b>{auctionStatus}</b>
              </p>
            )}
            <label>Start At</label>
            <input
              type="datetime-local"
              value={auctionConfig.startAt}
              onChange={(ev) =>
                setAuctionConfig((prev) => ({ ...prev, startAt: ev.target.value }))
              }
              disabled={!_id}
            />
            <label>End At</label>
            <input
              type="datetime-local"
              value={auctionConfig.endAt}
              onChange={(ev) =>
                setAuctionConfig((prev) => ({ ...prev, endAt: ev.target.value }))
              }
              disabled={!_id}
            />
            <label>Start Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={auctionConfig.startPrice}
              onChange={(ev) =>
                setAuctionConfig((prev) => ({ ...prev, startPrice: ev.target.value }))
              }
              disabled={!_id}
            />
            <label>Min Increment</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={auctionConfig.minIncrement}
              onChange={(ev) =>
                setAuctionConfig((prev) => ({
                  ...prev,
                  minIncrement: ev.target.value,
                }))
              }
              disabled={!_id}
            />
            {auctionError && <p className="form-error">{auctionError}</p>}
            {auctionMessage && <p className="text-green-700 mb-2">{auctionMessage}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-default"
                onClick={saveAuctionConfiguration}
                disabled={!_id || isAuctionSaving}
              >
                {isAuctionSaving ? "Saving..." : auctionId ? "Update Auction" : "Create Auction"}
              </button>
              <button
                type="button"
                className="btn-default"
                onClick={closeAuction}
                disabled={!auctionId || auctionStatus === "ended" || auctionStatus === "canceled"}
              >
                Close Auction
              </button>
            </div>
          </div>
        </>
      )}
      {formError && <p className="form-error">{formError}</p>}
      <button type="submit" className="btn-primary" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>
      <style jsx>{`
        .form-error {
          color: #dc2626;
          margin-bottom: 10px;
        }
        .switch-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 10px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #6b8e23;
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </form>
  );
}
