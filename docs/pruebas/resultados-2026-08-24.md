# Resultados de ejecución — 24 de agosto de 2026

Corrida sobre el commit `b14910a`. Se registra qué se ejecutó realmente, con qué
entorno, y qué **no** se pudo ejecutar.

## Entorno usado

| Capa | Qué se usó | Fidelidad |
| --- | --- | --- |
| Base de datos | PostgreSQL 16.13 local, con un *shim* que replica los roles de Supabase (`anon`, `authenticated`, `service_role`, `authenticator`, `supabase_admin`), `auth.users`, `auth.uid()`, `auth.jwt()` y `storage.objects` | Alta. El rol `postgres` se creó **no superusuario**, igual que en Supabase, que es la condición exacta que provocaba el fallo del SQL Editor |
| Aplicación | `next build` + `next start` reales, Chromium vía Playwright | Alta para render y validación de formularios |
| API de Supabase | **No disponible** (sin daemon de Docker, y el proxy bloquea la descarga de PostgREST/GoTrue) | — |
| Mercado Pago | **No disponible** (sin credenciales) | — |
| Producción | **No alcanzable** (el proxy de red deniega `CONNECT` a `www.mykoreastore.com`) | — |

## Bloque 0 — Verificación estática

| Prueba | Resultado |
| --- | --- |
| `npm run typecheck` | ✅ sin errores |
| `npm run lint` | ✅ sin errores ni advertencias |
| `npm run build` | ✅ 34 rutas |

## Migraciones

| Prueba | Resultado |
| --- | --- |
| Las 26 migraciones aplican en orden, como rol `postgres` **no superusuario** | ✅ |
| Las 4 migraciones nuevas son re-ejecutables (idempotentes) | ✅ |
| El script consolidado `aplicar-en-supabase.sql` corre completo sobre base limpia | ✅ |

## Guard de roles — reproducción del fallo reportado

| Prueba | Resultado |
| --- | --- |
| Con la función **anterior**, `UPDATE profiles SET role` como `postgres` no superusuario | ✅ falla con `ERROR: Solo un administrador puede cambiar el rol` — **es el error exacto que se veía en el Table Editor** |
| Con la función **nueva**, el mismo `UPDATE` | ✅ `UPDATE 1` |
| `customer` intenta auto-promoverse vía PostgREST | ✅ rechazado |
| `admin` cambia el rol de otro perfil vía PostgREST | ✅ permitido |
| `admin_set_user_role` invocado por un `customer` | ✅ rechazado |
| `admin_set_user_role` invocado por un `admin` | ✅ aplica el cambio |
| Un admin intenta quitarse a sí mismo el rol | ✅ rechazado |
| `audit_log` registra `from → to`, actor y `session_user` | ✅ |

## Legal — datos

| Prueba | Resultado |
| --- | --- |
| T&C y Política sembrados y vigentes (25.342 y 17.225 caracteres) | ✅ |
| Exactamente una versión vigente por tipo | ✅ |
| El contenido incluye razón social, NIT y correo de IKEBANA | ✅ |
| El trigger rellena solo `terms_version` / `privacy_version` al insertar una aceptación | ✅ |
| La vista `legal_acceptances_detailed` resuelve el nombre del titular | ✅ |
| Publicar v1.1.0 **no** altera las aceptaciones previas (siguen en 1.0.0) | ✅ |

## RLS

| Prueba | Resultado |
| --- | --- |
| Anónimo sólo ve los documentos `is_current` | ✅ |
| Un `customer` ajeno ve 0 aceptaciones y 1 perfil (el suyo) | ✅ |
| Un `admin` ve todas las aceptaciones y todos los perfiles | ✅ |
| `UPDATE` / `DELETE` sobre `legal_acceptances` como `customer` | ✅ 0 filas — evidencia inmutable |

## Bloque 2 — Registro y consentimiento (navegador)

| Prueba | Resultado |
| --- | --- |
| 2.1 Las tres casillas llegan sin marcar | ✅ |
| 2.2 Bloquea el alta si falta aceptar los T&C | ✅ |
| 2.3 Bloquea el alta si falta autorizar el tratamiento de datos | ✅ |
| 2.4 Los enlaces abren en pestaña nueva con `rel="noopener noreferrer"` | ✅ ambos |
| 2.4b Hacer clic en el enlace **no** marca la casilla | ✅ |
| 2.9 Exige contraseña de 8+ caracteres | ✅ |
| — Detecta contraseñas que no coinciden | ✅ |

## Bloque 3 — Restablecer contraseña (navegador)

| Prueba | Resultado |
| --- | --- |
| 3.8 Sin token válido muestra «el enlace no es válido o ya caducó» | ✅ |
| 3.8b Ofrece pedir un enlace nuevo | ✅ |
| 3.5 `/recuperar` carga | ✅ |

## Bloque 9 — Render de los textos legales (navegador)

| Prueba | Resultado |
| --- | --- |
| T&C: 29 secciones renderizadas (coincide con el original) | ✅ |
| Política: 20 secciones renderizadas (coincide con el original) | ✅ |
| Tablas renderizadas: 1 en T&C, 2 en la Política | ✅ |
| Razón social y NIT visibles en ambos | ✅ |
| Cero markdown crudo filtrado (`##`, `**`, `\|`, `[x](y)`) | ✅ |
| Sin desbordamiento horizontal en escritorio (1280 px) | ✅ |
| Sin desbordamiento horizontal en móvil (390 px) | ✅ |

**Total navegador: 22 pruebas, 22 pasaron.**

---

## Lo que NO se pudo ejecutar

Estos bloques del plan siguen **pendientes** y requieren credenciales reales:

| Bloque | Motivo |
| --- | --- |
| 4 — Catálogo y carrito | Requiere datos de producto y la API de Supabase |
| 5 — Compra multi-mercado (CO/MX/PE/EC) | Ídem, más configuración de mercados |
| 6 — Checkout y pago | Requiere credenciales de Mercado Pago |
| 7 — Área de cuenta | Requiere sesión autenticada contra GoTrue |
| 8 — Panel de administración | Ídem |
| 2.6–2.8, 2.10, 2.11 — alta real y escritura de la evidencia | Requiere GoTrue para `signUp` |
| 3.5–3.7 — ciclo real del correo de recuperación | Requiere el servicio de correo |
| 10.7 — webhook con firma inválida | Requiere el endpoint desplegado |

La lógica de base de datos de esos flujos sí quedó verificada arriba; lo que
falta es el recorrido de punta a punta con la aplicación desplegada.
