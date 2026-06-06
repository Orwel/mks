# Sitio público — My Korea Store

Descripción de la tienda online para el equipo de soporte y comercial.

---

## Estructura de páginas

| Ruta | Contenido |
| --- | --- |
| `/` | Portada: hero, ticker, destacados por categoría, banners secundarios, anuncios |
| `/catalogo` | Listado con filtros (categoría, precio, destacados, búsqueda) |
| `/catalogo/[slug]` | Ficha de producto: galería, versiones, precio, añadir al carrito |
| `/categoria/[slug]` | Productos de una categoría |
| `/carrito` | Líneas, cantidades, reserva de stock temporal |
| `/checkout` | Datos de envío, legal, pago con Mercado Pago |
| `/pedido/[orderNumber]` | Estado del pedido (invitado o post-compra) |
| `/nosotros` | Página institucional |
| `/contactanos` | Formulario de contacto |
| `/terminos` | Términos y condiciones vigentes |
| `/privacidad` | Política de privacidad vigente |
| `/login`, `/registro`, `/recuperar` | Autenticación |
| `/mi-cuenta`, `/mis-pedidos` | Área cliente (requiere sesión) |

Variantes de diseño de prueba (no producción principal): `/landing2`, `/landing3`, `/landing4`.

---

## Selector de mercado (país)

En el **header** el visitante elige el mercado (ej. 🇨🇴 Colombia). Eso determina:

- Moneda y precios mostrados
- Stock disponible (inventario por mercado)
- Pasarela Mercado Pago en la moneda del mercado

Solo aparecen mercados **activos** configurados en `/mercados`.

---

## Portada (`/`)

| Bloque | Origen de datos |
| --- | --- |
| Hero (textos) | `site_settings` → panel **Apariencia** |
| Panel «Destacados» (derecha) | Tabla `banners` posición hero → panel **Destacados** |
| Ticker | `ticker_messages` → **Ticker** |
| Destacados por categoría | Productos con `is_featured` y stock en el mercado activo |
| Anuncio pop-up / barra | `announcements` → **Anuncios pop-up** |

---

## Catálogo y producto

- Los productos se agrupan por **categoría → subcategoría**.
- Un producto puede tener **varias versiones** (tamaños, presentaciones); el cliente elige en la ficha si hay más de una.
- **Destacado** (badge): productos marcados en el panel; aparecen en la sección «Destacados por categoría» de la portada.
- Imágenes: galería cuadrada; recomendado **1200×1200 px** al subir.

---

## Carrito y stock

- Al añadir al carrito se **reserva stock** unos **15 minutos** (`reserve_stock` por versión y mercado).
- Si el tiempo expira, la reserva se libera (tarea programada en servidor).
- Quitar del carrito libera la reserva de esa línea.

---

## Checkout y pagos

- Checkout **invitado** permitido (sin cuenta).
- Aceptación obligatoria de T&C y privacidad (versión registrada).
- Pago vía **Mercado Pago** según mercado seleccionado.
- Tras pago confirmado (webhook): pedido pasa a `paid` y descuenta stock del mercado.

---

## Contacto

Formulario en `/contactanos` → mensajes visibles en panel **Contáctanos** (`/contacto`, solo admin).

---

## Marca y assets

Logos, favicon y manual de marca: [`public/brand/README.md`](../../public/brand/README.md).
