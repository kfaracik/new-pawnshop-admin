import Layout from "@/components/Layout";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

const AVAILABILITY_LABELS = {
  online_only: "Online",
  single_location: "Lokalizacja",
  multiple_locations: "Lokalizacje",
};

const formatPrice = (value) =>
  typeof value === "number" ? `${value.toFixed(2)} zł` : "-";

const getQuantity = (product) => {
  const raw = [product.availableQuantity, product.quantity, product.stock].find(
    (value) => Number.isFinite(Number(value))
  );
  return Number.isFinite(Number(raw)) ? Number(raw) : null;
};

const getLocationNames = (product, locationMap) => {
  if (product.availabilityMode === "online_only") return [];
  const details = Array.isArray(product.availableLocationDetails)
    ? product.availableLocationDetails
    : [];
  if (details.length) {
    return details.map((detail) => detail?.name).filter(Boolean);
  }
  return (product.availableLocations || [])
    .map((id) => locationMap[String(id)])
    .filter(Boolean);
};

const getLocationLabel = (product, locationMap) => {
  if (product.availabilityMode === "online_only") return "Online";
  const names = getLocationNames(product, locationMap);
  return names.length ? names.join(", ") : "—";
};

export default function Products() {
  const { data: session } = useSession();
  const canEdit = session?.user?.role === "admin";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      axios.get("/api/products"),
      axios.get("/api/categories"),
      axios.get("/api/locations"),
    ])
      .then(([productsRes, categoriesRes, locationsRes]) => {
        if (productsRes.status === "fulfilled") {
          setProducts(
            Array.isArray(productsRes.value.data) ? productsRes.value.data : []
          );
        }
        if (categoriesRes.status === "fulfilled") {
          setCategories(
            Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : []
          );
        }
        if (locationsRes.status === "fulfilled") {
          setLocations(
            Array.isArray(locationsRes.value.data) ? locationsRes.value.data : []
          );
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((category) => {
      if (category?._id) map[String(category._id)] = category.name || "—";
    });
    return map;
  }, [categories]);

  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach((location) => {
      if (location?._id) map[String(location._id)] = location.name || "—";
    });
    return map;
  }, [locations]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return products.filter((product) => {
      if (query && !String(product.title || "").toLowerCase().includes(query)) {
        return false;
      }
      if (categoryFilter && String(product.category) !== categoryFilter) {
        return false;
      }
      if (locationFilter) {
        if (locationFilter === "online") {
          if (product.availabilityMode !== "online_only") return false;
        } else {
          const ids = (product.availableLocations || []).map(String);
          const names = getLocationNames(product, locationMap);
          const matchesId = ids.includes(locationFilter);
          const matchesName = names.includes(locationMap[locationFilter]);
          if (!matchesId && !matchesName) return false;
        }
      }
      const price = Number(product.price);
      if (min !== null && Number.isFinite(min) && price < min) return false;
      if (max !== null && Number.isFinite(max) && price > max) return false;
      if (inStockOnly) {
        const quantity = getQuantity(product);
        if (quantity !== null && quantity <= 0) return false;
      }
      return true;
    });
  }, [
    products,
    search,
    categoryFilter,
    locationFilter,
    minPrice,
    maxPrice,
    inStockOnly,
    locationMap,
  ]);

  const hasActiveFilters =
    search ||
    categoryFilter ||
    locationFilter ||
    minPrice ||
    maxPrice ||
    inStockOnly;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setLocationFilter("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
  };

  const fieldClass =
    "rounded-md border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none";

  return (
    <Layout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-bold text-gray-800">Produkty</h1>
        {canEdit && (
          <Link className="btn-primary flex items-center" href={"/products/new"}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
            </svg>
            Dodaj produkt
          </Link>
        )}
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-gray-600">Szukaj po nazwie</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="np. Aparat, złoto…"
              className={fieldClass}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium text-gray-600">Kategoria</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={fieldClass}
            >
              <option value="">Wszystkie</option>
              {categories.map((category) => (
                <option key={category._id} value={String(category._id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium text-gray-600">Lokalizacja</span>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className={fieldClass}
            >
              <option value="">Wszystkie</option>
              <option value="online">Online</option>
              {locations.map((location) => (
                <option key={location._id} value={String(location._id)}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-1">
            <span className="text-xs font-medium text-gray-600">Cena (zł)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="od"
                className={`${fieldClass} w-full`}
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="do"
                className={`${fieldClass} w-full`}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="h-4 w-4"
            />
            Tylko dostępne (na stanie)
          </label>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              {filteredProducts.length} z {products.length}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-primary hover:underline"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`mobile-skeleton-${index}`}
              className="animate-pulse rounded-md border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-3 h-5 w-3/4 rounded bg-gray-200" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded bg-gray-200" />
                <div className="h-10 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        {!isLoading &&
          filteredProducts.map((product) => (
            <div key={product._id} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-800">{product.title}</h2>
                <strong className="whitespace-nowrap text-sm text-gray-800">
                  {formatPrice(Number(product.price))}
                </strong>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-gray-600">
                <div>
                  <dt className="text-xs text-gray-400">Ilość</dt>
                  <dd>{getQuantity(product) ?? "—"} szt.</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Kategoria</dt>
                  <dd>{categoryMap[String(product.category)] || "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-gray-400">Lokalizacja</dt>
                  <dd>{getLocationLabel(product, locationMap)}</dd>
                </div>
              </dl>
              {canEdit && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link className="btn-default justify-center" href={"/products/edit/" + product._id}>
                    Edytuj
                  </Link>
                  <Link className="btn-red justify-center" href={"/products/delete/" + product._id}>
                    Usuń
                  </Link>
                </div>
              )}
            </div>
          ))}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
            Brak produktów spełniających kryteria.
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <table className="basic mt-2">
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Cena</th>
              <th>Ilość</th>
              <th>Lokalizacja</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`desktop-skeleton-${index}`}>
                  <td colSpan={5}>
                    <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))}
            {!isLoading &&
              filteredProducts.map((product) => {
                const quantity = getQuantity(product);
                return (
                  <tr key={product._id}>
                    <td className="font-medium text-gray-800">{product.title}</td>
                    <td className="whitespace-nowrap">{formatPrice(Number(product.price))}</td>
                    <td>
                      <span
                        className={
                          quantity !== null && quantity <= 0
                            ? "text-red-600"
                            : "text-gray-700"
                        }
                      >
                        {quantity ?? "—"} szt.
                      </span>
                    </td>
                    <td className="text-gray-700">{getLocationLabel(product, locationMap)}</td>
                    <td>
                      {canEdit && (
                        <>
                          <Link className="btn-default" href={"/products/edit/" + product._id}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Edytuj
                          </Link>
                          <Link className="btn-red" href={"/products/delete/" + product._id}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Usuń
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            {!isLoading && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="text-gray-500">
                  Brak produktów spełniających kryteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
