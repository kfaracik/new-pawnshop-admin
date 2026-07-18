import Link from "next/link";

const leaf =
  "M0 0 C -1.4 -5, -9.5 -6.5, -9.5 -13 C -9.5 -17.4, -4 -19, -1.2 -16 C -0.5 -15.3, 0 -14.3, 0 -13.2 C 0 -14.3, 0.5 -15.3, 1.2 -16 C 4 -19, 9.5 -17.4, 9.5 -13 C 9.5 -6.5, 1.4 -5, 0 0 Z";

export default function Logo() {
  return (
    <Link href={"/"} className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <svg width="20" height="20" viewBox="-22 -22 44 44" fill="#C9A227" aria-hidden="true">
          <path d={leaf} transform="rotate(45)" />
          <path d={leaf} transform="rotate(135)" />
          <path d={leaf} transform="rotate(225)" />
          <path d={leaf} transform="rotate(315)" />
        </svg>
      </span>
      <span className="font-extrabold leading-tight text-gray-100">
        Nowy Lombard <span className="text-gold">Admin</span>
      </span>
    </Link>
  );
}
