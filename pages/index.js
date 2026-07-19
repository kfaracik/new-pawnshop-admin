import Layout from "@/components/Layout";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

const isPaidOrder = (order) =>
  Boolean(order?.paid) ||
  order?.paymentStatus === "paid" ||
  order?.orderStatus === "paid" ||
  order?.orderStatus === "completed";

const needsFulfillment = (order) => {
  const status = order?.fulfillmentStatus || "unfulfilled";
  return isPaidOrder(order) && (status === "unfulfilled" || status === "processing");
};

const orderUnits = (order) =>
  (order?.products || []).reduce(
    (sum, product) => sum + (Number(product?.quantity) || 0),
    0
  );

const orderRevenue = (order) => {
  const value = Number(order?.grandTotal ?? order?.totalAmount);
  return Number.isFinite(value) ? value : 0;
};

const formatMoney = (value) =>
  `${(Number(value) || 0).toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;

export default function Home() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [orders, setOrders] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    axios
      .get("/api/orders/stats")
      .then((response) => {
        if (!active) return;
        if (response.data && typeof response.data.total === "number") {
          setServerStats(response.data);
          return;
        }
        throw new Error("Invalid stats payload");
      })
      .catch(() =>
        axios
          .get("/api/orders")
          .then((response) => {
            if (!active) return;
            setOrders(Array.isArray(response.data) ? response.data : []);
          })
          .catch(() => active && setLoadError(true))
      )
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const computedStats = useMemo(() => {
    const paidOrders = orders.filter(isPaidOrder);
    const revenue = paidOrders.reduce((sum, order) => sum + orderRevenue(order), 0);
    const unitsSold = paidOrders.reduce((sum, order) => sum + orderUnits(order), 0);
    const byFulfillment = (status) =>
      orders.filter((order) => (order?.fulfillmentStatus || "unfulfilled") === status)
        .length;

    return {
      total: orders.length,
      paidCount: paidOrders.length,
      revenue,
      unitsSold,
      avgOrder: paidOrders.length ? revenue / paidOrders.length : 0,
      toFulfill: orders.filter(needsFulfillment).length,
      awaitingPayment: orders.filter(
        (order) => (order?.orderStatus || "pending_payment") === "pending_payment"
      ).length,
      processing: byFulfillment("processing"),
      shipped: byFulfillment("shipped"),
      delivered: byFulfillment("delivered"),
    };
  }, [orders]);

  const stats = serverStats || computedStats;

  const salesTiles = [
    { label: "Przychód (opłacone)", value: formatMoney(stats.revenue), accent: true },
    { label: "Sprzedane sztuki", value: stats.unitsSold },
    { label: "Opłacone zamówienia", value: stats.paidCount },
    { label: "Średnia wartość zamówienia", value: formatMoney(stats.avgOrder) },
  ];

  const fulfillmentTiles = [
    { label: "Do realizacji", value: stats.toFulfill, tone: "amber" },
    { label: "W przygotowaniu", value: stats.processing, tone: "gray" },
    { label: "W drodze", value: stats.shipped, tone: "blue" },
    { label: "Dostarczone", value: stats.delivered, tone: "green" },
  ];

  const toneClass = {
    gray: "border-gray-200 bg-white",
    amber: "border-amber-200 bg-amber-50",
    green: "border-emerald-200 bg-emerald-50",
    blue: "border-sky-200 bg-sky-50",
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold text-gray-900">Pulpit</h1>
          <p className="mt-1 text-sm text-gray-500">
            Witaj, {session?.user?.name || session?.user?.email} — oto podsumowanie sklepu.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session?.user?.name ? `Avatar ${session.user.name}` : "Avatar"}
              className="rounded-full"
              width={24}
              height={24}
              unoptimized
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-xs uppercase text-white" aria-hidden="true">
              {(session?.user?.name || session?.user?.email || "?").charAt(0)}
            </span>
          )}
          <span>{session?.user?.name || session?.user?.email}</span>
        </div>
      </div>

      {!isLoading && !loadError && (stats.toFulfill > 0 || stats.awaitingPayment > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {stats.toFulfill > 0 && (
            <Link
              href="/orders?status=to_fulfill"
              className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 transition-colors hover:bg-amber-100"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </span>
              <span className="text-sm">
                <strong className="block text-base">
                  {stats.toFulfill}{" "}
                  {stats.toFulfill === 1 ? "zamówienie" : stats.toFulfill < 5 ? "zamówienia" : "zamówień"}{" "}
                  do realizacji
                </strong>
                Opłacone, czekają na przygotowanie/wysyłkę →
              </span>
            </Link>
          )}
          {stats.awaitingPayment > 0 && (
            <Link
              href="/orders?status=awaiting_payment"
              className="flex items-center gap-3 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sky-900 transition-colors hover:bg-sky-100"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-400 text-sky-950">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className="text-sm">
                <strong className="block text-base">
                  {stats.awaitingPayment}{" "}
                  {stats.awaitingPayment === 1 ? "nowe zamówienie" : "nowych zamówień"}{" "}
                  czeka na płatność
                </strong>
                Kliknij, aby sprawdzić i potwierdzić →
              </span>
            </Link>
          )}
        </div>
      )}

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Nie udało się pobrać zamówień. Sprawdź połączenie z backendem (może się
          wybudzać) i odśwież stronę.
        </div>
      )}

      {isAdmin && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Zestawienie sprzedaży
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {salesTiles.map((tile) => (
              <div
                key={tile.label}
                className={`rounded-xl border p-4 shadow-sm ${
                  tile.accent ? "border-gold bg-gold-soft" : "border-gray-200 bg-white"
                }`}
              >
                <div className={`text-2xl font-bold ${tile.accent ? "text-gold-dark" : "text-gray-900"}`}>
                  {isLoading ? "…" : tile.value}
                </div>
                <div className="mt-1 text-sm text-gray-600">{tile.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Realizacja zamówień
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fulfillmentTiles.map((tile) => (
            <div key={tile.label} className={`rounded-xl border p-4 shadow-sm ${toneClass[tile.tone]}`}>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? "…" : tile.value}
              </div>
              <div className="mt-1 text-sm text-gray-600">{tile.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/orders" className="font-medium text-gold-dark hover:underline">
          Przejdź do zamówień →
        </Link>
        <Link href="/products" className="font-medium text-gold-dark hover:underline">
          Zarządzaj produktami →
        </Link>
        <span className="text-gray-400">Wszystkich zamówień: {isLoading ? "…" : stats.total}</span>
      </div>
    </Layout>
  );
}
