import Layout from "@/components/Layout";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 15;

const ROLE_LABEL = { admin: "Administrator", employee: "Pracownik (wgląd)" };

function TeamContent() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("employee");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await axios.get("/api/staff");
      setMembers(Array.isArray(data?.members) ? data.members : []);
      setCurrentUser(data?.currentUser || "");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error || "Nie udało się załadować zespołu."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && role === "admin") load();
  }, [status, role, load]);

  const addMember = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      await axios.post("/api/staff", { email: newEmail, role: newRole });
      setNewEmail("");
      setNewRole("employee");
      setNotice("Dodano konto do zespołu.");
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Nie udało się dodać konta.");
    } finally {
      setIsSaving(false);
    }
  };

  const changeRole = async (email, nextRole) => {
    setError("");
    setNotice("");
    try {
      await axios.put("/api/staff", { email, role: nextRole });
      setNotice(`Zmieniono rolę: ${email}.`);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Nie udało się zmienić roli.");
    }
  };

  const removeMember = async (email) => {
    if (!window.confirm(`Usunąć ${email} z zespołu?`)) return;
    setError("");
    setNotice("");
    try {
      await axios.delete(`/api/staff?email=${encodeURIComponent(email)}`);
      setNotice(`Usunięto konto: ${email}.`);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Nie udało się usunąć konta.");
    }
  };

  const pageCount = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const pagedMembers = useMemo(
    () => members.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [members, safePage]
  );

  if (status === "authenticated" && role !== "admin") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h1 className="text-lg font-semibold">Brak dostępu</h1>
        <p className="mt-1 text-sm">
          Zarządzanie zespołem jest dostępne tylko dla administratora.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Zespół organizacji</h1>
        <p className="text-sm text-gray-500">
          Zarządzaj kontami zespołu i ich uprawnieniami. Administrator ma pełny
          dostęp; pracownik tylko wgląd. Konta z konfiguracji serwera są
          oznaczone i nie można ich tu zmieniać.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <form
        onSubmit={addMember}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-gray-700">E-mail konta</span>
          <input
            type="email"
            required
            placeholder="osoba@firma.pl"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            className="min-w-[240px] rounded-md border border-gray-300 p-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-gray-700">Rola</span>
          <select
            value={newRole}
            onChange={(event) => setNewRole(event.target.value)}
            className="rounded-md border border-gray-300 p-2"
          >
            <option value="employee">Pracownik (wgląd)</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? "Dodawanie…" : "Dodaj do zespołu"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Rola</th>
              <th className="px-4 py-3">Źródło</th>
              <th className="px-4 py-3 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Brak kont w zespole.
                </td>
              </tr>
            ) : (
              pagedMembers.map((member) => {
                const isConfig = member.source === "config";
                const isSelf = member.email === currentUser;
                return (
                  <tr key={member.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">
                      {member.email}
                      {isSelf && (
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          to Ty
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isConfig ? (
                        <span className="font-medium text-gray-700">
                          {ROLE_LABEL[member.role]}
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(event) =>
                            changeRole(member.email, event.target.value)
                          }
                          className="rounded-md border border-gray-300 p-1.5 text-sm"
                          disabled={isSelf}
                        >
                          <option value="employee">Pracownik (wgląd)</option>
                          <option value="admin">Administrator</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isConfig
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isConfig ? "Konfiguracja (env)" : "Panel"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isConfig && !isSelf && (
                        <button
                          type="button"
                          className="btn-red"
                          onClick={() => removeMember(member.email)}
                        >
                          Usuń
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && members.length > 0 && (
        <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <Layout>
      <TeamContent />
    </Layout>
  );
}
