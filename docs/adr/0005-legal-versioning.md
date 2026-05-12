# ADR 0005 — Legal versionado y aceptación

## Decisión

Los textos legales viven en `legal_documents` con `version` e `is_current`. Cada compra referencia una fila en `legal_acceptances` ligada a las versiones exactas de T&C y privacidad, con `ip_address` y `user_agent`.

## Consecuencias

- Flujo de publicación: al emitir nueva versión, desactivar `is_current` de la anterior y marcar la nueva.
- Cumplimiento: contenido revisado por asesoría legal externa antes de producción.
