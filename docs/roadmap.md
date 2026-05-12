# Roadmap — My Korea Store

Documento vivo del progreso. Marca tareas con `[x]` al cerrarlas. Estado global al pie.

> **Estado global:** Sprint 0 ✅ · Sprint 1 ✅ · Sprint 3 ✅ (landing marca + datos Supabase) · demás ⚪  
> **Última actualización:** 2026-05-11

## Leyenda

- `[ ]` pendiente · `[x]` hecho · `[~]` en curso · `[!]` bloqueado  
- 🟢 hecho · 🟡 en curso · ⚪ pendiente

---

## Sprint 0 — Setup inicial 🟢

- [x] Scaffolding Next.js 16 + TS + Tailwind 4 + shadcn
- [x] Estructura clean architecture (`core`, `application`, `infrastructure`, `presentation`)
- [x] Clientes Supabase (browser / server / admin / middleware)
- [x] Rutas placeholder: público, auth, cuenta, dashboard, webhooks
- [x] Migraciones Supabase: schema + RLS + storage + vistas
- [x] Seed con categorías, productos demo, legal v1.0.0
- [x] Edge Functions (esqueleto)
- [x] Documentación base: `spec`, `architecture`, `database`, `api`, ADRs, `agents.md`, `claude.md`
- [x] `.env.example` y `README` raíz

## Sprint 1 — Auth y roles 🟢

- [x] `.env.local` configurado contra proyecto Supabase real
- [x] Helpers `getCurrentUser()`, `requireAuth()`, `requireRole()` / `requireStaff()`
- [x] Página `/login` (email + password, estilo marca)
- [x] Página `/registro` (trigger `profiles` vía `raw_user_meta_data.full_name`)
- [x] Página `/recuperar` (reset por email)
- [x] Logout (`SignOutButton`) + `router.refresh()`
- [x] Guards en layout `(dashboard)` (`requireStaff`) y `(account)` (`requireAuth`)
- [x] Smoke test manual: registrar, loguear, ver perfil (lo haces tú en local)

**Criterio de cierre:** usuario registrado con perfil; staff entra al dashboard con guardas.

## Sprint 2 — Catálogo público (lectura) ⚪

- [ ] `CategoryRepository` / queries Supabase
- [ ] `ProductRepository` + vista `products_with_available_stock`
- [ ] `/catalogo` con grid + filtros básicos
- [ ] `/categoria/[slug]` y `/catalogo/[slug]` con galería Storage
- [ ] ISR + `revalidateTag('catalog')`

## Sprint 3 — Landing dinámico + marca 🟡

- [x] Tokens de color / tipografía alineados a manual y logos (`globals.css`, fuentes en `layout.tsx`)
- [x] Activos en `public/brand/` (logos, `favicon.png`, `manual-marca.pdf`, `logo-primary.png`)
- [x] Header con logo oscuro sobre fondo claro; footer oscuro con logo blanco
- [x] `metadata.icons` → favicon desde `/brand/favicon.png`
- [x] Hero con estilo marca (neo-brutalist / acentos rosa y cyan)
- [x] `LandingTicker` (datos Supabase + fallback)
- [x] `LandingBanners` (hero + secundarios desde Supabase + fallback estático)
- [x] `LandingAnnouncement` (modal sesión; datos Supabase)
- [x] `FeaturedByCategory` (destacados desde Supabase + imágenes Storage cuando existan)
- [x] Footer legal enlazando `/terminos` y `/privacidad`

**Criterio de cierre:** landing operativa con marca; contenido dinámico desde BD cuando exista filas activas.

## Sprint 4 — Carrito + reserva de stock ⚪

- [ ] Store Zustand + `cart_id` (cookie)
- [ ] RPC `reserve_stock` en añadir al carrito
- [ ] `/carrito` completo
- [ ] Cron / función `cleanup_expired_stock_reservations`

## Sprint 5 — Checkout + legal ⚪

- [ ] `/checkout` con formulario y aceptación legal versionada
- [ ] `legal_acceptances` + `orders` en flujo guest
- [ ] `/pedido/[orderNumber]` seguimiento

## Sprint 6 — Pagos (Stripe + Mercado Pago) ⚪

- [ ] Checkout Sessions / Preferences
- [ ] Webhooks con firma e idempotencia
- [ ] Transición `paid` y consumo de reservas + stock
- [ ] Emails (Resend)

## Sprint 7 — Dashboard staff ⚪

- [ ] CRUD productos, categorías, banners, ticker, anuncios
- [ ] Pedidos y transiciones de estado
- [ ] Usuarios (solo admin)
- [ ] Legal editor + publicar versión

## Sprint 8 — Calidad y deploy ⚪

- [ ] Tests + e2e críticos
- [ ] Rate limiting y headers seguridad
- [ ] Sentry + CI + Vercel producción

---

## Backlog (post-MVP)

- [ ] OAuth Google · facturación DIAN · cupones · i18n · PWA · reseñas

## Decisiones cerradas

| ID | Decisión | ADR |
|----|----------|-----|
| 1 | Clean architecture pragmática | [0001](./adr/0001-clean-architecture.md) |
| 2 | Precio base COP + tasas | [0002](./adr/0002-multi-currency.md) |
| 3 | Reservas de stock | [0003](./adr/0003-stock-reservations.md) |
| 4 | Stripe + Mercado Pago | [0004](./adr/0004-dual-payment-gateway.md) |
| 5 | Legal versionado | [0005](./adr/0005-legal-versioning.md) |

---

## Cómo actualizar este archivo

1. Al terminar una tarea: cambiar `[ ]` por `[x]`.
2. Al cerrar un sprint: cambiar emoji del título a 🟢 y actualizar **Estado global** y la fecha arriba.
