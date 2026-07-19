import Layout from "@/components/Layout";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 15;

const OUTCOME_BADGE = {
  success: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  error: "bg-amber-100 text-amber-800",
};

const OUTCOME_LABEL = {
  success: "Wykonano",
  denied: "Zablokowano",
  error: "Błąd",
};

const ACTION_LABEL = {
  create: "utworzenie",
  update: "zmiana",
  delete: "usunięcie",
};

const RESOURCE_LABEL = {
  products: "Produkt",
  categories: "Kategoria",
  orders: "Zamówienie",
  locations: "Lokalizacja",
  upload: "Plik / zdjęcie",
};

const describeAction = (entry) => {
  const [resource, verb] = String(entry.action || "").split(".");
  const resourceLabel = RESOURCE_LABEL[resource] || resource || "Zasób";
  const verbLabel = ACTION_LABEL[verb] || verb || entry.method;
  return `${resourceLabel} — ${verbLabel}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function AuditContent() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/api/audit");
      setEntries(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error ||
          "Nie udało się załadować historii aktywności."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && role === "admin") {
      load();
    }
  }, [status, role, load]);

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const pagedEntries = useMemo(
    () => entries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [entries, safePage]
  );

  if (status === "authenticated" && role !== "admin") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h1 className="text-lg font-semibold">Brak dostępu</h1>
        <p className="mt-1 text-sm">
          Historia aktywności jest dostępna tylko dla konta administratora.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Historia aktywności</h1>
          <p className="text-sm text-gray-500">
            Pełny zapis zmian w panelu — kto, co i kiedy. Próby zablokowane
            (np. usunięcie przez pracownika) też są tu widoczne.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="btn-default"
          disabled={isLoading}
        >
          {isLoading ? "Odświeżanie…" : "Odśwież"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Osoba</th>
              <th className="px-4 py-3">Rola</th>
              <th className="px-4 py-3">Akcja</th>
              <th className="px-4 py-3">Element</th>
              <th className="px-4 py-3">Wynik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Brak zapisanych zdarzeń.
                </td>
              </tr>
            ) : (
              pagedEntries.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDate(entry.at)}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{entry.actorEmail}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {entry.actorRole === "admin" ? "Administrator" : "Pracownik"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {describeAction(entry)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.summary || entry.targetId || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        OUTCOME_BADGE[entry.outcome] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {OUTCOME_LABEL[entry.outcome] || entry.outcome}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && entries.length > 0 && (
        <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <Layout>
      <AuditContent />
    </Layout>
  );
}
