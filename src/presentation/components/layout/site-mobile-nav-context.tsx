"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type SiteMobileNavContextValue = {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

const SiteMobileNavContext = createContext<SiteMobileNavContextValue | null>(null);

export function SiteMobileNavProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const value = useMemo(
    () => ({ menuOpen, openMenu, closeMenu, toggleMenu }),
    [menuOpen, openMenu, closeMenu, toggleMenu],
  );

  return (
    <SiteMobileNavContext.Provider value={value}>{children}</SiteMobileNavContext.Provider>
  );
}

export function useSiteMobileNav() {
  const ctx = useContext(SiteMobileNavContext);
  if (!ctx) {
    throw new Error("useSiteMobileNav must be used within SiteMobileNavProvider");
  }
  return ctx;
}

export function useSiteMobileNavOptional() {
  return useContext(SiteMobileNavContext);
}
