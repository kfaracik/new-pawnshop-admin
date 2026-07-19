import Layout from "@/components/Layout";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import axios from "axios";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 10;

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

const PAYMENT_METHOD_LABELS = {
  bank_transfer: "Przelew tradycyjny",
  stripe_card: "Płatność online Stripe",
};

const DELIVERY_METHOD_LABELS = {
  courier_standard: "Kurier standard",
  parcel_locker: "Paczkomat / automat odbioru",
  store_pickup: "Odbiór osobisty",
};

const FULFILLMENT_BADGE = {
  unfulfilled: { label: "Nowe", cls: "bg-amber-100 text-amber-800" },
  processing: { label: "W przygotowaniu", cls: "bg-sky-100 text-sky-800" },
  shipped: { label: "Wysłane", cls: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Dostarczone", cls: "bg-emerald-100 text-emerald-800" },
  canceled: { label: "Anulowane", cls: "bg-red-100 text-red-700" },
};

const PAYMENT_BADGE = {
  paid: { label: "Opłacone", cls: "bg-emerald-100 text-emerald-800" },
  unpaid: { label: "Nieopłacone", cls: "bg-gray-100 text-gray-600" },
  pending: { label: "Płatność w trakcie", cls: "bg-amber-100 text-amber-800" },
  failed: { label: "Płatność nieudana", cls: "bg-red-100 text-red-700" },
  canceled: { label: "Płatność anulowana", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Zwrócone", cls: "bg-purple-100 text-purple-700" },
};

const formatMoney = (value) =>
  typeof value === "number" ? `${value.toFixed(2)} zł` : "-";

const getOptionLabel = (options, value, fallback = "-") =>
  options.find((option) => option.value === value)?.label || value || fallback;

// --- Order classification (shared with the dashboard buckets) ---
const isPaid = (o) =>
  Boolean(o?.paid) ||
  o?.paymentStatus === "paid" ||
  o?.orderStatus === "paid" ||
  o?.orderStatus === "completed";

const isFailed = (o) =>
  ["failed", "canceled"].includes(o?.orderStatus) ||
  ["failed", "canceled", "refunded"].includes(o?.paymentStatus) ||
  o?.fulfillmentStatus === "canceled";

const isCompleted = (o) =>
  !isFailed(o) &&
  (o?.orderStatus === "completed" ||
    ["shipped", "delivered"].includes(o?.fulfillmentStatus));

const isToFulfill = (o) =>
  !isFailed(o) &&
  !isCompleted(o) &&
  isPaid(o) &&
  ["unfulfilled", "processing"].includes(o?.fulfillmentStatus || "unfulfilled");

const isAwaitingPayment = (o) => !isFailed(o) && !isCompleted(o) && !isPaid(o);

const FILTERS = [
  { key: "to_fulfill", label: "Do realizacji", predicate: isToFulfill },
  { key: "awaiting_payment", label: "Oczekujące na płatność", predicate: isAwaitingPayment },
  { key: "completed", label: "Zrealizowane", predicate: isCompleted },
  { key: "failed", label: "Nieudane", predicate: isFailed },
  { key: "all", label: "Wszystkie", predicate: () => true },
];

const DEFAULT_FILTER = "to_fulfill";

const shortRef = (id) => `#${String(id || "").slice(-6).toUpperCase()}`;

function CopyId({ id }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — ignore, the full id is shown below anyway
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Kopiuj pełne ID zamówienia"
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-50"
    >
      {copied ? (
        "Skopiowano ✓"
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.6} stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          Kopiuj ID
        </>
      )}
    </button>
  );
}

function Badge({ label, cls }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = session?.user?.role === "admin";
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [page, setPage] = useState(1);

  const loadOrders = useCallback(() => {
    setIsLoading(true);
    setError("");
    setNotice("");
    axios
      .get("/api/orders")
      .then((response) => {
        setOrders(Array.isArray(response.data) ? response.data : []);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Nie udało się załadować zamówień."
        );
      })
      .finally(() => setIsLoading(false));
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

  // Deep-link support: /orders?status=to_fulfill (dashboard links here)
  useEffect(() => {
    const q = router.query.status;
    if (typeof q === "string" && FILTERS.some((f) => f.key === q)) {
      setFilter(q);
    }
  }, [router.query.status]);

  const counts = useMemo(() => {
    const map = {};
    FILTERS.forEach((f) => {
      map[f.key] = orders.filter(f.predicate).length;
    });
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter) || FILTERS[FILTERS.length - 1];
    return orders.filter(active.predicate);
  }, [orders, filter]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedOrders = useMemo(
    () => filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredOrders, safePage]
  );

  const changeFilter = (key) => {
    setFilter(key);
    setPage(1);
    router.replace(
      { pathname: "/orders", query: key === DEFAULT_FILTER ? {} : { status: key } },
      undefined,
      { shallow: true }
    );
  };

  const controls = (order, isUpdating) => (
    <div className="mt-3 grid gap-3 border-t border-gray-100 pt-3 sm:grid-cols-3">
      {[
        { label: "Status zamówienia", field: "orderStatus", options: ORDER_STATUS_OPTIONS, fallback: "pending_payment" },
        { label: "Płatność", field: "paymentStatus", options: PAYMENT_STATUS_OPTIONS, fallback: "unpaid" },
        { label: "Realizacja", field: "fulfillmentStatus", options: FULFILLMENT_STATUS_OPTIONS, fallback: "unfulfilled" },
      ].map(({ label, field, options, fallback }) => (
        <label key={field} className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
          <select
            className="rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50"
            value={order[field] || fallback}
            disabled={isUpdating || !canEdit}
            onChange={(event) => updateOrder(order._id, { [field]: event.target.value })}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-bold text-gray-800">Zamówienia</h1>
        <button type="button" onClick={loadOrders} className="btn-default" disabled={isLoading}>
          {isLoading ? "Odświeżanie…" : "Odśwież"}
        </button>
      </div>

      {error && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => changeFilter(f.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-black"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                  active ? "bg-black/15 text-black" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-3">
          {pagedOrders.map((order) => {
            const isUpdating = updatingOrderId === order._id;
            const fulfill = FULFILLMENT_BADGE[order.fulfillmentStatus || "unfulfilled"];
            const pay = PAYMENT_BADGE[order.paymentStatus || "unpaid"];
            return (
              <article key={order._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* Header: badges + id + total */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {fulfill && <Badge label={fulfill.label} cls={fulfill.cls} />}
                    {pay && <Badge label={pay.label} cls={pay.cls} />}
                    <span className="font-mono text-sm font-bold text-gray-800">{shortRef(order._id)}</span>
                    <CopyId id={order._id} />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatMoney(order.grandTotal ?? order.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("pl-PL") : "-"}
                    </div>
                  </div>
                </div>

                {/* Body: customer + order details */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="text-sm text-gray-700">
                    <div className="font-semibold text-gray-900">{order.customer?.name || "Brak odbiorcy"}</div>
                    {order.customer?.email && <div className="text-gray-600">{order.customer.email}</div>}
                    <div className="mt-1 text-gray-600">
                      {order.customer?.streetAddress}
                      <br />
                      {order.customer?.postalCode} {order.customer?.city}
                      {order.customer?.country ? `, ${order.customer.country}` : ""}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 sm:text-right">
                    <div>
                      Dostawa: <span className="text-gray-800">{DELIVERY_METHOD_LABELS[order.deliveryMethod] || order.deliveryMethod || "-"}</span>
                      {typeof order.deliveryPrice === "number" ? ` (${formatMoney(order.deliveryPrice)})` : ""}
                    </div>
                    {order.deliveryEtaLabel && <div className="text-xs text-gray-400">{order.deliveryEtaLabel}</div>}
                    <div className="mt-1">
                      Płatność: <span className="text-gray-800">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || "-"}</span>
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-gray-400">ID: {order._id}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-sm text-gray-700">
                  {(order.products || []).map((p, index) => (
                    <span key={`${order._id}-${index}`}>
                      {p.name} <span className="text-gray-400">×{p.quantity}</span>
                    </span>
                  ))}
                </div>

                {/* Status controls (admin only) */}
                {canEdit && controls(order, isUpdating)}
              </article>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              {orders.length === 0
                ? "Brak zamówień."
                : "Brak zamówień w tym widoku. Zmień filtr powyżej, aby zobaczyć inne."}
            </div>
          )}
        </div>
      )}

      {!isLoading && filteredOrders.length > 0 && (
        <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
      )}
    </Layout>
  );
}
