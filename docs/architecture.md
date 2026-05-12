# Arquitectura — My Korea Store

## Clean Architecture (pragmática)

Capas y dependencias (hacia dentro):

1. **Dominio** (`src/core`): entidades lógicas, value objects, errores de dominio. Sin imports de frameworks.
2. **Aplicación** (`src/application`): casos de uso, puertos (interfaces). Depende solo del dominio.
3. **Infraestructura** (`src/infrastructure`): Supabase, Stripe, Mercado Pago, email. Implementa puertos.
4. **Presentación** (`src/app`, `src/presentation`, `src/components/ui`): Next.js, componentes de página, shadcn.

Las **Server Actions** y **Route Handlers** en `src/app/api` actúan como adaptadores: validan entrada, invocan casos de uso y devuelven DTOs.

## Estructura de carpetas (resumen)

```
src/
  app/                 # App Router (rutas, layouts, API)
  application/         # Casos de uso y puertos
  core/                # Dominio
  infrastructure/      # Clientes externos (Supabase, …)
  presentation/        # Componentes de negocio, providers
  components/ui/       # Primitivas shadcn
  lib/utils.ts         # Utilidades compartidas (cn)
  shared/config/       # site.ts, env.ts (zod)
```

## Autenticación y sesión

- **Supabase Auth** con cookies vía `@supabase/ssr`.
- `src/middleware.ts` refresca la sesión en cada request (si existen variables públicas de Supabase).
- **RLS** en Postgres como última línea de defensa; operaciones sensibles también vía `service_role` en servidor.

## Despliegue

- **Vercel** (app) + **Supabase Cloud** (DB/Auth/Storage).
- Variables documentadas en `.env.example`.
