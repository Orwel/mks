/** Rutas públicas de activos de marca (`public/brand/`). */
export const brandAssets = {
  /** Header claro: contraste alto */
  logoHeader: "/brand/logo-negro.png",
  /** Footer u overlays oscuros */
  logoFooter: "/brand/logo-blanco.png",
  /** Hero y piezas de marketing (full color) */
  logoPrimary: "/brand/logo-primary.png",
  logoOrange: "/brand/logo-naranja.png",
  logoPink: "/brand/logo-rosa.png",
  favicon: "/brand/favicon.png",
  /** Arte extra de marca si se usa en landing */
  assetSticker: "/brand/Asset%204@4x.png",
} as const;

export const brandMeta = {
  /** Aproximación a la paleta del manual (ajustar con lectura fina del PDF) */
  pinkHex: "#FF1B8D",
  cyanHex: "#00D4DD",
  inkHex: "#0A0A0A",
  creamHex: "#FFF8F5",
} as const;
