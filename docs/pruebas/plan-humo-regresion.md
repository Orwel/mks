# Plan de pruebas — humo y regresión

Guion ejecutable para validar la tienda de punta a punta. Cada caso indica
**precondición**, **pasos** y **resultado esperado**.

> **Entorno.** Ejecutar contra un proyecto Supabase de pruebas o contra
> producción en horario de baja carga. Requiere `.env.local` con
> `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
> `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` y
> `NEXT_PUBLIC_SITE_URL`. Los pagos se prueban con las
> [tarjetas de prueba de Mercado Pago](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards).

## 0. Verificación estática (previa a cualquier despliegue)

| # | Comando | Esperado |
| --- | --- | --- |
| 0.1 | `npm run typecheck` | Sin errores |
| 0.2 | `npm run lint` | Sin errores ni advertencias |
| 0.3 | `npm run build` | Compila y genera las 34 rutas |
| 0.4 | `supabase db push` | Aplica las migraciones sin conflicto |

---

## 1. Humo — el sistema arranca

| # | Caso | Esperado |
| --- | --- | --- |
| 1.1 | Abrir `/` sin sesión | Landing con banners, ticker y catálogo |
| 1.2 | Abrir `/catalogo` | Lista productos del mercado activo con precio en su moneda |
| 1.3 | Abrir `/terminos` | Renderiza el texto **desde la BD**, con cabecera «Versión 1.0.0» |
| 1.4 | Abrir `/privacidad` | Ídem, documento de privacidad |
| 1.5 | Abrir `/dashboard` sin sesión | Redirige a `/login?next=/dashboard` |
| 1.6 | Abrir `/dashboard` con rol `customer` | Redirige a `/mi-cuenta?error=no_admin` |

---

## 2. Registro y consentimiento

| # | Caso | Pasos | Esperado |
| --- | --- | --- | --- |
| 2.1 | Casillas no premarcadas | Abrir `/registro` | Las tres casillas aparecen **vacías** |
| 2.2 | Bloqueo sin T&C | Llenar todo, marcar sólo privacidad, enviar | Error «Debes aceptar los Términos y condiciones»; no se crea cuenta |
| 2.3 | Bloqueo sin privacidad | Marcar sólo T&C, enviar | Error «Debes autorizar el tratamiento de tus datos personales» |
| 2.4 | Hipervínculo T&C | Clic en «Términos y condiciones» dentro de la casilla | Abre `/terminos` en pestaña nueva; **no** marca la casilla |
| 2.5 | Hipervínculo privacidad | Clic en «Política de privacidad» | Abre `/privacidad` en pestaña nueva |
| 2.6 | Alta correcta | Marcar ambas obligatorias, enviar | Cuenta creada; entra a `/mi-cuenta` o pide confirmar correo |
| 2.7 | **Trazabilidad** | Panel → Legal → «Trazabilidad de aceptaciones» | Fila nueva con origen **Registro**, versión `1.0.0` en ambas columnas, fecha, IP y user agent |
| 2.8 | Marketing opcional | Registrar sin marcar marketing | `marketing_opt_in = false` en la fila de aceptación y en `profiles` |
| 2.9 | Contraseña corta | Escribir 6 caracteres | Error «Mínimo 8 caracteres» |
| 2.10 | Correo repetido | Registrar un correo ya existente | «Ese correo ya tiene una cuenta»; **no** se crea una segunda aceptación |
| 2.11 | Sin documentos publicados | Despublicar T&C en el panel e intentar registrarse | Error explícito pidiendo publicar los documentos; no se crea cuenta huérfana |

### Consulta SQL de verificación

```sql
select source, terms_version, privacy_version, accepted_terms,
       accepted_privacy, marketing_opt_in, ip_address, accepted_at
from public.legal_acceptances_detailed
order by accepted_at desc
limit 10;
```

---

## 3. Autenticación

| # | Caso | Esperado |
| --- | --- | --- |
| 3.1 | Login correcto (customer) | Va a `/mi-cuenta` |
| 3.2 | Login correcto (admin) | Va a `/dashboard` |
| 3.3 | Credenciales malas | «Correo o contraseña incorrectos» |
| 3.4 | Cuenta desactivada (staff) | `/login?error=cuenta_inactiva` |
| 3.5 | **Recuperar contraseña** | `/recuperar` → llega correo → el enlace abre `/restablecer`, **no** inicia sesión en la app |
| 3.6 | Fijar contraseña nueva | En `/restablecer`, escribir clave nueva | «Contraseña actualizada»; cierra sesión y redirige a `/login` |
| 3.7 | Entrar con la clave nueva | Login exitoso |
| 3.8 | Enlace caducado | Abrir `/restablecer` sin token | «El enlace no es válido o ya caducó» + botón para pedir otro |
| 3.9 | Cerrar sesión | Vuelve a estado anónimo; `/mi-cuenta` redirige a login |

> **Configuración requerida:** en Supabase → Authentication → URL Configuration,
> agregar `https://www.mykoreastore.com/restablecer` a **Redirect URLs**.

---

## 4. Catálogo y carrito

| # | Caso | Esperado |
| --- | --- | --- |
| 4.1 | Ficha de producto | Muestra versiones, precio del mercado activo y galería |
| 4.2 | Cambiar de versión | La galería vuelve a la **primera** foto de la versión nueva |
| 4.3 | Agregar al carrito | La línea aparece; se crea fila en `stock_reservations` |
| 4.4 | Stock insuficiente | Pedir más unidades de las disponibles | Error de reserva; no se agrega |
| 4.5 | Quitar del carrito | Se libera la reserva (`release_stock_reservation`) |
| 4.6 | Expiración de reserva | Esperar >15 min sin pagar | La reserva se libera y el stock vuelve a estar disponible |
| 4.7 | Persistencia | Recargar la página | El carrito sobrevive (localStorage `mks-cart-lines-v2`) |
| 4.8 | Filtros del catálogo | Aplicar categoría / stock / búsqueda | La URL refleja los filtros y los resultados corresponden |

---

## 5. Compra multi-mercado (nacionalidades)

Repetir **todo el bloque** para cada mercado activo: **CO, MX, PE, EC**.

| # | Caso | Esperado |
| --- | --- | --- |
| 5.1 | Seleccionar mercado | El catálogo, la moneda y los precios cambian al del mercado |
| 5.2 | **Cambio de mercado con carrito lleno** | El carrito se vacía **y** las reservas del mercado anterior se liberan en la BD |
| 5.3 | Producto sin precio en ese mercado | No aparece en el catálogo de ese mercado |
| 5.4 | Checkout | El resumen muestra la moneda del mercado, no COP |
| 5.5 | Dirección de envío | Los campos exigidos corresponden al mercado seleccionado |
| 5.6 | Pedido creado | `orders.market_code`, `currency` y `rate_to_cop_snapshot` corresponden al mercado |
| 5.7 | Precio en cero | Producto sin precio asignado | Error explícito pidiendo asignar precio en el panel |
| 5.8 | Redondeo | Moneda sin decimales (p. ej. COP) | El total no lleva decimales |

### Consulta SQL de verificación

```sql
select order_number, market_code, currency, total, rate_to_cop_snapshot, payment_status
from public.orders
order by created_at desc
limit 10;
```

---

## 6. Checkout y pago

| # | Caso | Esperado |
| --- | --- | --- |
| 6.1 | Casillas separadas | El checkout muestra **dos** casillas obligatorias, con enlace cada una |
| 6.2 | Sin aceptar | Enviar sin marcar | El navegador bloquea el envío (`required`) y el servidor rechaza |
| 6.3 | Pago aprobado | Tarjeta de prueba APRO | Redirige a `/pedido/{orderNumber}`; pedido en `paid`; stock descontado |
| 6.4 | Pago rechazado | Tarjeta OTHE | Pedido queda `cancelled` / `failed`; **el stock no se descuenta** |
| 6.5 | Pago pendiente | Tarjeta CONT | Pedido permanece `pending_payment` |
| 6.6 | Cancelar en MP | Volver sin pagar | `/checkout?cancelled=1` con aviso; el carrito se conserva |
| 6.7 | Webhook idempotente | Reenviar la misma notificación | Responde `duplicate: true`; el stock **no** se descuenta dos veces |
| 6.8 | **Aceptación ligada** | Revisar el pedido | `orders.legal_acceptance_id` apunta a una aceptación con origen **checkout** y las versiones vigentes |
| 6.9 | Reserva consumida | Tras el pago | `stock_reservations.consumed_at` queda marcado **sólo en el carrito del pedido** |
| 6.10 | **No hay sobreventa** | Dos clientes reservan la misma versión; uno paga | La reserva del otro **sobrevive**; el disponible baja para ambos. Regresión de la migración `20260824110000` |
| 6.11 | Detector | Forzar un pedido mayor al stock | Aparece `orders.oversell_detected` en `audit_log` |

### Consulta SQL de verificación

```sql
select o.order_number, o.status, o.payment_status,
       a.source, a.terms_version, a.privacy_version, a.ip_address
from public.orders o
join public.legal_acceptances a on a.id = o.legal_acceptance_id
order by o.created_at desc
limit 10;
```

---

## 7. Área de cuenta (usuario)

| # | Caso | Esperado |
| --- | --- | --- |
| 7.1 | `/mi-cuenta` | Muestra nombre, teléfono y mercado preferido |
| 7.2 | Editar perfil | Los cambios persisten tras recargar |
| 7.3 | `/mis-pedidos` | Lista **sólo** los pedidos propios |
| 7.4 | Detalle de pedido | Ítems, totales, moneda y estado correctos |
| 7.5 | **Aislamiento RLS** | Abrir `/mis-pedidos/{id}` de otro usuario | No lo muestra |

---

## 8. Panel de administración

| # | Caso | Esperado |
| --- | --- | --- |
| 8.1 | Acceso | Sólo rol `admin` entra a `/dashboard` y rutas hermanas |
| 8.2 | **Cambiar rol** | Usuarios → cambiar rol → «Actualizar rol» | Mensaje de confirmación visible **y** el `select` queda en el rol nuevo |
| 8.3 | **Error visible** | Provocar un fallo (p. ej. quitarse el propio admin) | Mensaje de error explícito, nunca silencio |
| 8.4 | Auto-protección | Intentar bajarse a sí mismo de admin | Bloqueado con aviso |
| 8.5 | Activar/desactivar cuenta | El estado cambia y se refleja al recargar |
| 8.6 | Auditoría de rol | Revisar `audit_log` | Fila `profiles.role_changed` con `from`, `to` y actor |
| 8.7 | Categorías | Crear, editar, reordenar y desactivar |
| 8.8 | Productos y versiones | Crear producto, agregar versión, subir imágenes |
| 8.9 | Imágenes de versión | Tras subir, el selector de archivo **se limpia** |
| 8.10 | Precios por mercado | Asignar precio y stock por mercado; se reflejan en la tienda |
| 8.11 | Banners / ticker / anuncios | Alta, orden y vigencia por fechas |
| 8.12 | Apariencia | Cambiar colores y textos del footer; se reflejan en el sitio |
| 8.13 | Pedidos | Ver detalle y cambiar estado; queda historial |
| 8.14 | Contacto | Los mensajes de `/contactanos` aparecen en el panel |

---

## 9. Legal — fuente única de verdad

| # | Caso | Esperado |
| --- | --- | --- |
| 9.1 | Publicación | Panel → Legal → crear versión `1.1.0` → Publicar | `/terminos` muestra el texto nuevo y «Versión 1.1.0» |
| 9.2 | Una sola vigente | Tras publicar | Sólo una fila con `is_current = true` por tipo |
| 9.3 | **Inmutabilidad** | Intentar editar la versión vigente | Bloqueado con aviso: hay que crear una versión nueva |
| 9.4 | Edición de borrador | Editar un borrador no publicado | Se guarda con confirmación |
| 9.5 | Versión duplicada | Crear otra vez `1.0.0` | Error explícito pidiendo otro número |
| 9.6 | **Vínculo por versión** | Registrar un usuario, publicar `1.1.0`, registrar otro | Cada aceptación queda ligada a la versión vigente en su momento |
| 9.7 | Sin duplicados | Buscar textos legales en el código | No hay texto legal fuera de la BD |

### Consulta SQL de verificación

```sql
select type, version, is_current, effective_date, length(content) as caracteres
from public.legal_documents
order by type, published_at desc;
```

---

## 10. Seguridad y RLS

| # | Caso | Esperado |
| --- | --- | --- |
| 10.1 | Escalada de rol | Como `customer`, `update profiles set role='admin' where id=auth.uid()` | Rechazado por el trigger |
| 10.2 | Perfiles ajenos | Como `customer`, leer `profiles` | Sólo la fila propia |
| 10.3 | Pedidos ajenos | Como `customer`, leer `orders` | Sólo los propios |
| 10.4 | Borradores legales | Como anónimo, leer `legal_documents` | Sólo `is_current = true` |
| 10.5 | Aceptaciones | Como `customer`, leer `legal_acceptances` | Sólo las propias |
| 10.6 | Inmutabilidad de la evidencia | Como `customer`, actualizar o borrar una aceptación | Rechazado (sin políticas de UPDATE/DELETE) |
| 10.7 | Webhook con firma inválida | POST con `x-signature` incorrecto | `401` |

---

## 11. Latido / disponibilidad

| # | Caso | Esperado |
| --- | --- | --- |
| 11.1 | `GET /api/health` | `200` con `{"ok":true,"db":"up"}` |
| 11.2 | Cabeceras | `Cache-Control: no-store` — nunca servido desde caché |
| 11.3 | Workflow manual | Actions → «Mantener Supabase activo» → *Run workflow* → en verde |
| 11.4 | Programado | Corre a diario a las 12:00 UTC (07:00 en Colombia) |
| 11.5 | Base pausada | El workflow falla con `::error::` y avisa en el resumen |

> GitHub deshabilita los workflows programados tras 60 días sin actividad en el
> repositorio. Si eso ocurre, reactivarlo desde la pestaña *Actions*.

---

## Cobertura conocida

- **No cubierto por pruebas automatizadas.** El repositorio no tiene aún
  *runner* de pruebas; este plan es manual. Si se automatiza, empezar por los
  bloques 2, 5, 6 y 9, que son los que tocan dinero y cumplimiento legal.
- **Requiere credenciales reales.** Los bloques 5 y 6 no se pueden ejecutar sin
  claves de Mercado Pago y una base de datos poblada.
