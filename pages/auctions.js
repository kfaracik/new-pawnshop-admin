import Layout from "@/components/Layout";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const EMPTY_FORM = {
  productId: "",
  startAt: "",
  endAt: "",
  startPrice: "",
  minIncrement: "",
};

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

export default function AuctionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingAuctionId, setEditingAuctionId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/auctions", {
        params: { status: statusFilter || undefined },
      });
      setAuctions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load auctions.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  function resetForm() {
    setEditingAuctionId("");
    setForm(EMPTY_FORM);
  }

  function startEdit(auction) {
    setEditingAuctionId(auction._id || auction.id);
    setForm({
      productId: typeof auction.productId === "object" ? (auction.productId?._id || "") : (auction.productId || ""),
      startAt: toDatetimeLocal(auction.startAt),
      endAt: toDatetimeLocal(auction.endAt),
      startPrice: String(auction.startPrice ?? ""),
      minIncrement: String(auction.minIncrement ?? ""),
    });
  }

  async function saveAuction(ev) {
    ev.preventDefault();

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        productId: form.productId.trim(),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        startPrice: Number(form.startPrice),
        minIncrement: Number(form.minIncrement),
      };

      if (editingAuctionId) {
        await axios.put(`/api/auctions/${editingAuctionId}`, payload);
        setMessage("Auction updated.");
      } else {
        await axios.post("/api/auctions", payload);
        setMessage("Auction created.");
      }

      resetForm();
      fetchAuctions();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to save auction.");
    } finally {
      setIsSaving(false);
    }
  }

  async function closeAuction(id) {
    setError("");
    setMessage("");
    try {
      await axios.post(`/api/auctions/${id}/close`, {});
      setMessage("Auction closed.");
      fetchAuctions();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to close auction.");
    }
  }

  async function deleteAuction(id) {
    setError("");
    setMessage("");
    try {
      await axios.delete(`/api/auctions/${id}`);
      setMessage("Auction deleted.");
      fetchAuctions();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to delete auction.");
    }
  }

  return (
    <Layout>
      <h1>Auctions</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {message && <p className="text-green-700 mb-2">{message}</p>}

      <div className="bg-white p-4 rounded-md shadow-sm mb-4">
        <h2 className="mb-2">{editingAuctionId ? "Edit Auction" : "Create Auction"}</h2>
        <form onSubmit={saveAuction}>
          <label>Product ID</label>
          <input
            type="text"
            value={form.productId}
            onChange={(ev) => setForm((prev) => ({ ...prev, productId: ev.target.value }))}
            required
          />

          <label>Start At</label>
          <input
            type="datetime-local"
            value={form.startAt}
            onChange={(ev) => setForm((prev) => ({ ...prev, startAt: ev.target.value }))}
            required
          />

          <label>End At</label>
          <input
            type="datetime-local"
            value={form.endAt}
            onChange={(ev) => setForm((prev) => ({ ...prev, endAt: ev.target.value }))}
            required
          />

          <label>Start Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.startPrice}
            onChange={(ev) => setForm((prev) => ({ ...prev, startPrice: ev.target.value }))}
            required
          />

          <label>Min Increment</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.minIncrement}
            onChange={(ev) => setForm((prev) => ({ ...prev, minIncrement: ev.target.value }))}
            required
          />

          <div className="flex gap-2">
            {editingAuctionId && (
              <button type="button" className="btn-default" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>

      <div className="mb-3">
        <select
          value={statusFilter}
          onChange={(ev) => setStatusFilter(ev.target.value)}
          className="mb-0"
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="ended">Ended</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading auctions...</p>
      ) : (
        <table className="basic">
          <thead>
            <tr>
              <th>Status</th>
              <th>Product</th>
              <th>Start</th>
              <th>End</th>
              <th>Current/Start</th>
              <th>Min inc</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((auction) => {
              const id = auction._id || auction.id;
              return (
                <tr key={id}>
                  <td>{auction.status}</td>
                  <td>{typeof auction.productId === "object" ? (auction.productId?.title || auction.productId?._id || "-") : auction.productId}</td>
                  <td>{auction.startAt ? new Date(auction.startAt).toLocaleString() : "-"}</td>
                  <td>{auction.endAt ? new Date(auction.endAt).toLocaleString() : "-"}</td>
                  <td>{auction.currentPrice ?? "-"} / {auction.startPrice ?? "-"}</td>
                  <td>{auction.minIncrement ?? "-"}</td>
                  <td>
                    <button className="btn-default mr-1" type="button" onClick={() => startEdit(auction)}>
                      Edit
                    </button>
                    <button
                      className="btn-default mr-1"
                      type="button"
                      onClick={() => closeAuction(id)}
                      disabled={auction.status === "ended" || auction.status === "canceled"}
                    >
                      Close
                    </button>
                    <button className="btn-red" type="button" onClick={() => deleteAuction(id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {auctions.length === 0 && (
              <tr>
                <td colSpan={7}>No auctions.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
