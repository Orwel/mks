# ADR 0005 — Legal versionado y aceptación

## Contexto

Los actos jurídicos (Términos y Condiciones y Política de Tratamiento de Datos
Personales) los consumen tres partes del sistema: la web pública, el registro y
el checkout. Además el panel de administración permite publicarlos. Sin una
fuente única, cada consumidor tiende a quedarse con su propia copia y las
versiones se desincronizan.

El titular de la relación jurídica es **IKEBANA CO S.A.S.** (NIT 901.492.922-4),
que opera la tienda bajo el nombre comercial **MY KOREA STORE**.

## Decisión

**1. Una sola fuente de verdad.** El texto vive únicamente en
`legal_documents`, con `type`, `version`, `title`, `content`, `effective_date` e
`is_current`. No hay texto legal en el código de la aplicación ni en
`site_settings`. Las páginas `/terminos` y `/privacidad` renderizan la fila
`is_current = true` de su tipo; el registro y el checkout leen esa misma fila
para saber qué versión está aceptando el usuario.

**2. Las versiones son inmutables una vez publicadas.** El panel permite editar
borradores, pero no la versión vigente: quien ya la aceptó quedó ligado a ese
texto exacto. Cambiar algo exige crear una versión nueva y publicarla, lo que
desactiva la anterior.

**3. La aceptación se prueba, no se presume.** Cada aceptación crea una fila en
`legal_acceptances` con las versiones exactas de ambos documentos, la marca de
tiempo, la dirección IP, el user agent y el origen (`registration`, `checkout`,
`account_update`). Las filas son *append-only*: no hay políticas RLS de UPDATE
ni DELETE.

**4. Autorizaciones separadas.** La aceptación del contrato y la autorización
de tratamiento de datos personales se recogen en **casillas independientes y
nunca premarcadas**, con hipervínculo al documento dentro del propio texto de
la casilla. La autorización de comunicaciones comerciales es una tercera
casilla, opcional. Esto responde al artículo 9 de la Ley 1581 de 2012: la
autorización debe ser previa, expresa e informada, y no puede ir refundida en
la aceptación de otro acto.

## Consecuencias

- **Flujo de publicación:** crear borrador → revisar → publicar. Publicar
  desactiva `is_current` de la versión anterior del mismo tipo dentro de la
  misma acción.
- **Trazabilidad:** el panel (`/legal`) expone la vista
  `legal_acceptances_detailed` con las últimas aceptaciones y su evidencia.
- **Retroactividad:** cada pedido queda ligado a la versión vigente al momento
  de confirmarlo (`orders.legal_acceptance_id`). Publicar una versión nueva no
  altera contratos ya perfeccionados.
- **Revisión externa:** el contenido de la versión 1.0.0 se redactó contra la
  Ley 1480 de 2011, la Ley 1581 de 2012, el Decreto 1074 de 2015, la Ley 527 de
  1999 y la Ley 2300 de 2023. Debe ser revisado y firmado por asesoría legal
  externa antes de considerarse definitivo.
