# ADR 0001 — Clean Architecture en Next.js

## Contexto

Se requiere mantenibilidad, testabilidad y límites claros entre UI, reglas de negocio e integraciones (Supabase, pagos).

## Decisión

Adoptar **Clean Architecture pragmática** con carpetas `core`, `application`, `infrastructure` y `presentation`, sin exceso de indirección.

## Consecuencias

- Los casos de uso viven en `application` y reciben repositorios por interfaz.
- Los adaptadores Supabase implementan esos puertos en `infrastructure`.
- Posible fricción inicial al añadir features; se compensa con tests de dominio aislados.
