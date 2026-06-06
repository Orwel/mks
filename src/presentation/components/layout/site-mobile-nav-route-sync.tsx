"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useSiteMobileNav } from "@/presentation/components/layout/site-mobile-nav-context";

/** Cierra el menú móvil al cambiar de ruta. */
export function SiteMobileNavRouteSync() {
  const pathname = usePathname();
  const { closeMenu } = useSiteMobileNav();

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  return null;
}
