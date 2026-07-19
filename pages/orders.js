import Layout from "@/components/Layout";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

const ORDER_STATUS_OPTIONS = [
  { value: "pending_payment", label: "Oczekuje na płatność" },
  { value: "paid", label: "Opłacone" },
  { value: "completed", label: "Zrealizowane" },
  { value: "canceled", label: "Anulowane" },
  { value: "failed", label: "Nieudane" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid", label: "Nieopłacone" },
  { value: "pending", label: "W trakcie" },
  { value: "paid", label: "Opłacone" },
  { value: "failed", label: "Nieudane" },
  { value: "canceled", label: "Anulowane" },
  { value: "refunded", label: "Zwrócone" },
];

const FULFILLMENT_STATUS_OPTIONS = [
  { value: "unfulfilled", label: "Nowe" },
  { value: "processing", label: "W przygotowaniu" },
  { value: "shipped", label: "Wysłane" },
  { value: "delivered", label: "Dostarczone" },
  { value: "canceled", label: "Anulowane" },
];

const formatMoney = (value) =>
  typeof value === "number" ? `${value.toFixed(2)} zł` : "-";

const getOptionLabel = (options, value, fallback = "-") =>
  options.find((option) => option.value === value)?.label || value || fallback;

const PAYMENT_METHOD_LABELS = {
  bank_transfer: "Przelew tradycyjny",
  stripe_card: "Płatność online Stripe",
};

const DELIVERY_METHOD_LABELS = {
  courier_standard: "Kurier standard",
  parcel_locker: "Paczkomat / automat odbioru",
  store_pickup: "Odbiór osobisty",
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const canEdit = session?.user?.role === "admin";
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(() => {
    setIsLoading(true);
    setError("");
    setNotice("");
    axios
      .get("/api/orders")
      .then((response) => {
        setOrders(response.data);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Nie udało się załadować zamówień."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const updateOrder = useCallback(async (orderId, payload) => {
    setUpdatingOrderId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await axios.put(`/api/orders?id=${encodeURIComponent(orderId)}`, payload);
      setOrders((current) =>
        current.map((order) => (order._id === orderId ? response.data : order))
      );
      setNotice("Zaktualizowano zamówienie.");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Nie udało się zaktualizować zamówienia."
      );
    } finally {
      setUpdatingOrderId("");
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <Layout>
      <h1 className="mb-4 text-xl font-bold text-gray-800">Zamówienia</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {notice && <p className="text-green-700 mb-2">{notice}</p>}
      {isLoading && <p>Ładowanie zamówień...</p>}
      <div className="grid gap-3 md:hidden">
        {orders.length > 0 &&
          orders.map((order) => {
            const isUpdating = updatingOrderId === order._id;

            return (
            <article key={order._id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    {order.customer?.name || "No recipient"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <strong className="text-sm text-gray-800">
                  {formatMoney(order.grandTotal ?? order.totalAmount)}
                </strong>
              </div>
              <p className={`text-sm ${order.orderStatus === "completed" ? "text-green-600" : "text-gray-600"}`}>
                Zamówienie: {getOptionLabel(ORDER_STATUS_OPTIONS, order.orderStatus, "Oczekuje na płatność")}
              </p>
              <p className={`text-sm ${order.paymentStatus === "paid" ? "text-green-600" : "text-gray-600"}`}>
                Płatność: {getOptionLabel(PAYMENT_STATUS_OPTIONS, order.paymentStatus, "Nieopłacone")}
              </p>
              <p className="text-sm text-gray-600">
                Dostawa: {DELIVERY_METHOD_LABELS[order.deliveryMethod] || order.deliveryMethod || "-"} ({formatMoney(order.deliveryPrice)})
              </p>
              <p className="text-sm text-gray-600">
                Metoda: {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || "-"} / checkout: {order.paymentSessionStatus || "-"}
              </p>
              <div className="mt-2 text-sm text-gray-600">
                <p>{order.customer?.email}</p>
                <p>
                  {order.customer?.city} {order.customer?.postalCode} {order.customer?.country}
                </p>
                <p>{order.customer?.streetAddress}</p>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-700">
                {(order.products || []).map((p, index) => (
                  <p key={`${order._id}-${index}`}>
                    {p.name} x{p.quantity}
                  </p>
                ))}
              </div>
              <div className="mt-3 grid gap-2 border-t border-gray-100 pt-3 text-sm">
                <label className="grid gap-1">
                  <span className="font-medium text-gray-700">Status zamówienia</span>
                  <select
                    className="rounded-md border border-gray-300 p-2"
                    value={order.orderStatus || "pending_payment"}
                    disabled={isUpdating || !canEdit}
                    onChange={(event) =>
                      updateOrder(order._id, { orderStatus: event.target.value })
                    }
                  >
                    {ORDER_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-medium text-gray-700">Status płatności</span>
                  <select
                    className="rounded-md border border-gray-300 p-2"
                    value={order.paymentStatus || "unpaid"}
                    disabled={isUpdating || !canEdit}
                    onChange={(event) =>
                      updateOrder(order._id, { paymentStatus: event.target.value })
                    }
                  >
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-medium text-gray-700">Realizacja</span>
                  <select
                    className="rounded-md border border-gray-300 p-2"
                    value={order.fulfillmentStatus || "unfulfilled"}
                    disabled={isUpdating || !canEdit}
                    onChange={(event) =>
                      updateOrder(order._id, { fulfillmentStatus: event.target.value })
                    }
                  >
                    {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
            );
          })}
        {orders.length === 0 && !isLoading && (
          <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
            Brak zamówień.
          </div>
        )}
      </div>
      <div className="hidden md:block">
        <table className="basic">
          <thead>
            <tr>
              <th>Data</th>
              <th>Status zamówienia</th>
              <th>Status płatności</th>
              <th>Realizacja</th>
              <th>Odbiorca</th>
              <th>Dostawa</th>
              <th>Metoda płatności</th>
              <th>Produkty</th>
              <th>Suma</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 &&
              orders.map((order) => {
                const isUpdating = updatingOrderId === order._id;

                return (
                <tr key={order._id}>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    <select
                      className="rounded-md border border-gray-300 p-2 text-sm"
                      value={order.orderStatus || "pending_payment"}
                      disabled={isUpdating || !canEdit}
                      onChange={(event) =>
                        updateOrder(order._id, { orderStatus: event.target.value })
                      }
                    >
                      {ORDER_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="rounded-md border border-gray-300 p-2 text-sm"
                      value={order.paymentStatus || "unpaid"}
                      disabled={isUpdating || !canEdit}
                      onChange={(event) =>
                        updateOrder(order._id, { paymentStatus: event.target.value })
                      }
                    >
                      {PAYMENT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="rounded-md border border-gray-300 p-2 text-sm"
                      value={order.fulfillmentStatus || "unfulfilled"}
                      disabled={isUpdating || !canEdit}
                      onChange={(event) =>
                        updateOrder(order._id, { fulfillmentStatus: event.target.value })
                      }
                    >
                      {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {order.customer?.name} {order.customer?.email}
                    <br />
                    {order.customer?.city} {order.customer?.postalCode} {order.customer?.country}
                    <br />
                    {order.customer?.streetAddress}
                  </td>
                  <td>
                    {DELIVERY_METHOD_LABELS[order.deliveryMethod] || order.deliveryMethod || "-"}
                    <br />
                    {typeof order.deliveryPrice === "number"
                      ? formatMoney(order.deliveryPrice)
                      : "-"}
                    <br />
                    {order.deliveryEtaLabel || "-"}
                  </td>
                  <td>
                    {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || "-"}
                    <br />
                    {order.paymentSessionStatus || "-"}
                  </td>
                  <td>
                    {(order.products || []).map((p, index) => (
                      <span key={`${order._id}-${index}`}>
                        {p.name} x{p.quantity}
                        <br />
                      </span>
                    ))}
                  </td>
                  <td>
                    {formatMoney(order.grandTotal ?? order.totalAmount)}
                  </td>
                </tr>
                );
              })}
            {orders.length === 0 && !isLoading && (
              <tr>
                <td colSpan={9}>Brak zamówień.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
