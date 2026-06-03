/** Rutas del segmento `(dashboard)`; acceso app + RLS restringido a `admin`. */
const ADMIN_PANEL_PREFIXES = [
  "/dashboard",
  "/productos",
  "/categorias",
  "/mercados",
  "/apariencia",
  "/pedidos",
  "/destacados",
  "/banners",
  "/ticker",
  "/anuncios",
  "/legal",
  "/usuarios",
] as const;

export function isAdminPanelPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  return ADMIN_PANEL_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
