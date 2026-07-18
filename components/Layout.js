import { useSession, signIn } from "next-auth/react";
import Nav from "@/components/Nav";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function Layout({ children }) {
  const [showNav, setShowNav] = useState(false);
  const { data: session, status } = useSession();

  if (!session) {
    return (
      <div className="bg-ink w-screen h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <p className="mb-6 text-sm text-gray-400">
            Zaloguj się, aby zarządzać katalogiem, kategoriami i zamówieniami.
          </p>
          <button
            type="button"
            onClick={() => signIn()}
            className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-black transition-colors hover:bg-gold-light"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bgGray min-h-screen flex flex-col">
      <a className="skip-link" href="#main-content">
        Przejdź do treści
      </a>
      <header className="flex items-center p-4 md:hidden bg-ink text-white">
        <button
          type="button"
          aria-label={showNav ? "Zamknij menu nawigacji" : "Otwórz menu nawigacji"}
          onClick={() => setShowNav(!showNav)}
          className="mr-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="flex grow justify-center">
          <Logo />
        </div>
      </header>
      <div className="flex flex-grow">
        <Nav show={showNav} onClose={() => setShowNav(false)} />
        <main id="main-content" className="flex-grow p-3 sm:p-4">{children}</main>
      </div>
      <footer className="bg-ink text-gray-400 py-4 text-center mt-auto text-sm">
        <p>Nowy Lombard Admin &copy; 2026 — panel zarządzania</p>
      </footer>
    </div>
  );
}
