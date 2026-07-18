import Link from "next/link";

const petal = "M0 -2 C 6 -8, 6 -19, 0 -23 C -6 -19, -6 -8, 0 -2 Z";

export default function Logo() {
  return (
    <Link href={"/"} className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <svg width="20" height="20" viewBox="-26 -26 52 52" fill="#C9A227" aria-hidden="true">
          <path d={petal} transform="rotate(0)" />
          <path d={petal} transform="rotate(90)" />
          <path d={petal} transform="rotate(180)" />
          <path d={petal} transform="rotate(270)" />
        </svg>
      </span>
      <span className="font-extrabold leading-tight text-gray-100">
        Nowy Lombard <span className="text-gold">Admin</span>
      </span>
    </Link>
  );
}
