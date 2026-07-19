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

export default function Home() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    axios
      .get("/api/orders")
      .then((response) => {
        if (!active) return;
        setOrders(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => active && setLoadError(true))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const toFulfill = orders.filter(needsFulfillment);
    const awaitingPayment = orders.filter(
      (order) => (order?.orderStatus || "pending_payment") === "pending_payment"
    );
    const shipped = orders.filter(
      (order) => order?.fulfillmentStatus === "shipped"
    );
    return {
      total: orders.length,
      toFulfill: toFulfill.length,
      awaitingPayment: awaitingPayment.length,
      shipped: shipped.length,
    };
  }, [orders]);

  const tiles = [
    { label: "Wszystkie zamówienia", value: stats.total, tone: "gray" },
    { label: "Do realizacji", value: stats.toFulfill, tone: "amber" },
    { label: "Oczekują na płatność", value: stats.awaitingPayment, tone: "gray" },
    { label: "Wysłane", value: stats.shipped, tone: "green" },
  ];

  const toneClass = {
    gray: "border-gray-200 bg-white",
    amber: "border-amber-200 bg-amber-50",
    green: "border-emerald-200 bg-emerald-50",
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-bold text-gray-800">
          Witaj, {session?.user?.name || session?.user?.email}
        </h1>
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
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

      {!isLoading && !loadError && stats.toFulfill > 0 && (
        <Link
          href="/orders"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 transition-colors hover:bg-amber-100"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </span>
          <span className="text-sm">
            <strong className="block text-base">
              Masz {stats.toFulfill}{" "}
              {stats.toFulfill === 1
                ? "zamówienie"
                : stats.toFulfill < 5
                  ? "zamówienia"
                  : "zamówień"}{" "}
              do realizacji
            </strong>
            Opłacone i czekają na przygotowanie/wysyłkę — kliknij, aby przejść do zamówień.
          </span>
        </Link>
      )}

      {!isLoading && !loadError && stats.toFulfill === 0 && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Wszystko na bieżąco — brak opłaconych zamówień oczekujących na realizację.
        </div>
      )}

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Nie udało się pobrać zamówień. Sprawdź połączenie z backendem (może się
          wybudzać) i odśwież stronę.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`rounded-xl border p-4 shadow-sm ${toneClass[tile.tone]}`}
          >
            <div className="text-3xl font-bold text-gray-800">
              {isLoading ? "…" : tile.value}
            </div>
            <div className="mt-1 text-sm text-gray-600">{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/orders" className="text-sm font-medium text-primary hover:underline">
          Przejdź do zamówień →
        </Link>
      </div>
    </Layout>
  );
}
