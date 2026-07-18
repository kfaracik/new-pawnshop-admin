import Link from "next/link";
import {useRouter} from "next/router";
import {signOut, useSession} from "next-auth/react";
import Logo from "@/components/Logo";

export default function Nav({show, onClose}) {
  const inactiveLink = 'flex gap-2 p-2 md:p-2 rounded-lg items-center min-h-11 text-gray-300 hover:bg-white/5 hover:text-white transition-colors';
  const activeLink = 'flex gap-2 p-2 md:p-2 rounded-lg items-center min-h-11 bg-white/10 text-gold font-semibold';
  const inactiveIcon = 'w-6 h-6 shrink-0';
  const activeIcon = inactiveIcon + ' text-gold';
  const router = useRouter();
  const {pathname} = router;
  const {data: session} = useSession();
  const isAdmin = session?.user?.role === 'admin';
  async function logout() {
    await router.push('/');
    await signOut();
  }
  return (
    <aside aria-label="Nawigacja panelu administratora" className={(show?'left-0':'-left-full')+" top-0 text-gray-300 p-4 fixed w-[85vw] max-w-xs bg-ink h-full md:static md:w-auto md:rounded-2xl md:m-2 transition-all z-50 shadow-xl md:shadow-none"}>
      <div className="mb-4 mr-4">
        <Logo />
      </div>
      <nav className="flex flex-col gap-2">
        <Link href={'/'} onClick={onClose} className={pathname === '/' ? activeLink : inactiveLink}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={pathname === '/' ? activeIcon : inactiveIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          Dashboard
        </Link>
        <Link href={'/products'} onClick={onClose} className={pathname.includes('/products') ? activeLink : inactiveLink}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={pathname.includes('/products') ? activeIcon : inactiveIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          Products
        </Link>
        <Link href={'/categories'} onClick={onClose} className={pathname.includes('/categories') ? activeLink : inactiveLink}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={pathname.includes('/categories') ? activeIcon : inactiveIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        Categories
        </Link>
        <Link href={'/orders'} onClick={onClose} className={pathname.includes('/orders') ? activeLink : inactiveLink}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={pathname.includes('/orders') ? activeIcon : inactiveIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          Orders
        </Link>
        {isAdmin && (
          <Link href={'/audit'} onClick={onClose} className={pathname.includes('/audit') ? activeLink : inactiveLink}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={pathname.includes('/audit') ? activeIcon : inactiveIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historia
          </Link>
        )}
        {session?.user?.email && (
          <div className="mt-1 px-2 py-1 text-xs text-gray-500">
            {session.user.email}
            <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-gold">
              {isAdmin ? 'Administrator' : 'Pracownik'}
            </span>
          </div>
        )}
        <button type="button" onClick={logout} className={inactiveLink}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Logout
        </button>
      </nav>
    </aside>
  );
}
