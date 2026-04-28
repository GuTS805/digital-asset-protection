"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

const NO_NAV = ["/login"];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = NO_NAV.includes(pathname);

  return (
    <>
      {!hideNav && <Navbar />}
      <main className={hideNav ? "min-h-screen" : "min-h-screen pt-14"}>
        {children}
      </main>
    </>
  );
}
