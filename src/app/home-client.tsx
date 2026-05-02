"use client";

import { Navbar } from "@/components/layout/navbar";
import type { NavItem } from "@/lib/get-navbar-content";

export function HomeClient({ children, navItems }: { children: React.ReactNode; navItems?: NavItem[] }) {
  return (
    <>
      <Navbar currentPage="anasayfa" navItems={navItems} />
      {children}
    </>
  );
}
