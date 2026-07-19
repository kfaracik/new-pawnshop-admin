import { useMemo } from "react";

function buildPages(page, pageCount) {
  const pages = [];
  for (let p = 1; p <= pageCount; p += 1) {
    const isEdge = p === 1 || p === pageCount;
    const isNear = Math.abs(p - page) <= 1;
    if (isEdge || isNear) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return pages;
}

export default function Pagination({ page, pageCount, onChange, className = "" }) {
  const pages = useMemo(() => buildPages(page, pageCount), [page, pageCount]);

  if (!pageCount || pageCount <= 1) return null;

  const go = (target) => onChange(Math.min(Math.max(1, target), pageCount));
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors";
  const normal = "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
  const active = "border-primary bg-primary text-black";
  const disabled = "cursor-default opacity-40";

  return (
    <nav
      className={`mt-4 flex flex-wrap items-center justify-center gap-1.5 ${className}`}
      aria-label="Paginacja"
    >
      <button
        type="button"
        className={`${base} ${page <= 1 ? `${normal} ${disabled}` : normal}`}
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Poprzednia strona"
      >
        ‹
      </button>

      {pages.map((entry, index) =>
        entry === "…" ? (
          <span key={`gap-${index}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            className={`${base} ${entry === page ? active : normal}`}
            onClick={() => go(entry)}
            aria-current={entry === page ? "page" : undefined}
          >
            {entry}
          </button>
        )
      )}

      <button
        type="button"
        className={`${base} ${page >= pageCount ? `${normal} ${disabled}` : normal}`}
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        aria-label="Następna strona"
      >
        ›
      </button>
    </nav>
  );
}
