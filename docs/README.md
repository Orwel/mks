# Documentación — My Korea Store (MKS)

Índice central del proyecto. El código vive en la raíz del repo; aquí está la guía humana y para asistentes de IA.

## Manual de usuario (operación)

- [**Manual de administración**](./manual-usuario/manual-administracion.md) — panel: mercados, productos, pedidos, marketing.
- [**Sitio público**](./manual-usuario/sitio-publico.md) — rutas de la tienda y flujo de compra.
- [**Especificaciones de imágenes (WhatsApp)**](./manual-usuario/whatsapp-especificaciones-imagenes.txt) — texto para enviar al cliente.

## Para agentes de IA

- [**agents.md**](./agents.md) — Cursor / Composer: capas, seguridad, rutas, calidad.
- [**claude.md**](./claude.md) — Claude: prioridades, legal, pagos, checklist.

## Roadmap y progreso

- [**roadmap.md**](./roadmap.md) — sprints, tareas `[x]` y estado global

## Documentación técnica

- [Especificación funcional y técnica](./spec.md)
- [Arquitectura](./architecture.md)
- [Base de datos](./database.md)
- [API e integraciones](./api.md)
- [Decisiones (ADR)](./adr/)

---

## Proyecto (resumen operativo)

E-commerce con **Next.js 16**, **Supabase** y **Mercado Pago** (multi-mercado: CO, MX, PE, EC).

### Requisitos

- Node.js 20+
- Cuenta [Supabase](https://supabase.com) (o [CLI](https://supabase.com/docs/guides/cli) local)

### Arranque local

```bash
cp .env.example .env.local
# Completa al menos NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para auth en cliente.

npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) (o el puerto que indique el terminal).

### Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor tras `build` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |

### Supabase

```bash
supabase link    # proyecto remoto
supabase db push
# o local:
supabase start
supabase db reset
```

Migraciones: `supabase/migrations/`. Seed: `supabase/seed.sql`.

### Marca

Logos, favicon y manual: [`../public/brand/README.md`](../public/brand/README.md).
