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

## Segunda corrida — bloques 4 a 7 sobre la lógica de base de datos

Se sembró un catálogo realista (2 productos, 3 versiones, precios y stock en
CO/MX/PE/EC) y se ejercitaron las RPC y vistas reales, que **son** la
implementación de esos flujos.

### Bloque 4 — Carrito y reservas

| Prueba | Resultado |
| --- | --- |
| 4.3 `reserve_stock` crea la reserva | ✅ |
| 4.4 Pedir más de lo disponible → `insufficient_stock` | ✅ |
| 4.4b Disponible = stock − reservas activas | ✅ 10 → 7 con 3 reservadas |
| 4.x Cantidad 0 o negativa → `invalid_quantity` | ✅ |
| 4.x Producto inactivo → `product_not_found` | ✅ |
| 4.5 `release_stock_reservation` libera | ✅ |
| 4.6 Reserva vencida no cuenta como disponible y `cleanup` la borra | ✅ |

### Bloque 5 — Multi-mercado

| Prueba | Resultado |
| --- | --- |
| 5.1 Cada mercado muestra su precio y moneda | ✅ CO/COP, MX/MXN, PE/PEN, EC/USD |
| 5.3 Producto sin precio en un mercado no aparece ahí | ✅ |
| 5.x Versión sin precio en el mercado no es reservable ahí | ✅ |
| 5.x Stock agotado en un mercado no bloquea otro | ✅ |
| 5.x El stock es independiente por mercado | ✅ |
| 5.8 Redondeo por moneda, unidades menores y conversión | ✅ 21 pruebas (`npm run test:money`) |

### Bloque 6 — Confirmación de pago

| Prueba | Resultado |
| --- | --- |
| 6.3 Pago aprobado descuenta stock y marca el pedido `paid` | ✅ |
| 6.7 Reconfirmar el mismo pago es idempotente | ✅ `already_paid`, sin doble descuento |
| 6.9 La reserva del pedido queda consumida y atada a él | ✅ |
| 6.x Se registra el historial de estados | ✅ |
| 6.x Pedido inexistente → `order_not_found` | ✅ |
| 6.x **Sobreventa** | ❌ **bug encontrado — corregido** (ver abajo) |

### Bloque 7 — Aislamiento por RLS

| Actor | Pedidos visibles (de 4 en la base) |
| --- | --- |
| Cliente A | 1 (el suyo) ✅ |
| Cliente B | 1 (el suyo) ✅ |
| Administrador | 4 ✅ |
| Anónimo | 0 pedidos, 0 reservas, 0 aceptaciones ✅ |

---

## Bug encontrado y corregido: sobreventa

**`fulfill_order_payment` consumía las reservas de stock de todos los
compradores, no sólo las del pedido que se estaba pagando.**

El `UPDATE` sobre `stock_reservations` filtraba por `version_id` +
`market_code` + `consumed_at is null`, sin ninguna condición que lo atara al
comprador. Al pagar un cliente, las reservas activas de los demás quedaban
marcadas como consumidas y atribuidas a su pedido.

### Reproducción

Partiendo de 10 unidades:

1. A reserva 3, B reserva 2 → disponible 5.
2. A paga → stock 7. **La reserva de B queda consumida y atribuida al pedido de A.**
3. La tienda vuelve a ofrecer 7 (debería ofrecer 5).
4. C reserva 7. B paga sus 2 → stock 5. **La reserva de C también se consume.**
5. C paga sus 7 sobre un stock de 5.

**Resultado medido: 12 unidades vendidas y cobradas de un inventario de 10.**

### Corrección

Migración `20260824110000_fix_reservation_consumption_oversell.sql`:

- `orders.cart_id` guarda el carrito que originó el pedido, poblado en el
  checkout desde la cookie `mks_cart_id`.
- El consumo de reservas se limita a ese carrito; para pedidos anteriores se cae
  a `user_id`, y si no hay ninguno no se toca ninguna reserva ajena.
- Si el pedido excediera el stock, se registra `orders.oversell_detected` en
  `audit_log` en vez de enmascararlo con `greatest(...,0)`.

### Verificación tras el arreglo

| Prueba | Resultado |
| --- | --- |
| Mismo escenario, paso 2: la reserva de B sobrevive | ✅ sin consumir, sin `order_id` |
| Disponible tras el pago de A | ✅ 5 (antes 7) |
| C intenta reservar 7 | ✅ rechazado, sólo hay 5 |
| Total vendido y cobrado del inventario de 10 | ✅ **exactamente 10** |
| Cada reserva queda atada a su propio pedido | ✅ A→A, B→B, C→C |
| El detector salta cuando el stock no alcanza | ✅ registra `habia=1, pidio=3, faltante=2` |

---

## Lo que NO se pudo ejecutar

Estos bloques del plan siguen **pendientes** y requieren credenciales reales:

| Bloque | Motivo |
| --- | --- |
| 4, 5, 7 — recorrido por HTTP | La lógica de BD quedó verificada arriba; falta el paso por PostgREST y la interfaz |
| 6 — Pago real contra Mercado Pago | Requiere credenciales; la confirmación del pedido sí quedó verificada |
| 8 — Panel de administración por interfaz | Las reglas de RLS y el cambio de rol sí quedaron verificados |
| 2.6–2.8, 2.10, 2.11 — alta real y escritura de la evidencia | Requiere GoTrue para `signUp` |
| 3.5–3.7 — ciclo real del correo de recuperación | Requiere el servicio de correo |
| 10.7 — webhook con firma inválida | Requiere el endpoint desplegado |

La lógica de base de datos de esos flujos sí quedó verificada arriba; lo que
falta es el recorrido de punta a punta con la aplicación desplegada.
