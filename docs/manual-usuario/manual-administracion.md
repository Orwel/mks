# Manual de administración — My Korea Store

Guía operativa del panel de administración. Actualizado según la estructura actual: **mercados por país**, **versiones de producto**, **inventario por mercado** y **Mercado Pago** como única pasarela.

---

## 1. Acceso y roles

| Rol | Acceso |
| --- | --- |
| **admin** | Panel completo: usuarios, legal, contacto, mercados, catálogo, pedidos, marketing |
| **employee** | Catálogo, pedidos y contenido (según RLS); no gestiona usuarios ni legal |
| **customer** | Solo tienda pública y cuenta cliente (`/mi-cuenta`, `/mis-pedidos`) |

**Entrada:** `/login` → redirección al panel si el rol lo permite.

**Salir:** botón «Cerrar sesión» en la barra lateral del panel.

**Ver la tienda:** enlace «Ver tienda» en el menú lateral (abre la portada pública).

---

## 2. Resumen del panel

| Sección | Ruta | Para qué sirve |
| --- | --- | --- |
| Resumen | `/dashboard` | Accesos rápidos a las áreas principales |
| Categorías | `/categorias` | Árbol de categorías y subcategorías |
| Mercados | `/mercados` | Países activos, moneda y acceso a productos por mercado |
| Apariencia | `/apariencia` | Colores, textos del hero, footer y secciones |
| Pedidos | `/pedidos` | Bandeja y cambio de estados |
| Destacados | `/destacados` | Banners del panel «Ofertas & novedades» en la portada |
| Ticker | `/ticker` | Mensajes rotativos bajo el header |
| Anuncios pop-up | `/anuncios` | Modales o barras al entrar al sitio |
| Legal | `/legal` | Términos y privacidad versionados |
| Contáctanos | `/contacto` | Mensajes del formulario público |
| Usuarios | `/usuarios` | Roles (solo admin) |

> La ruta antigua `/productos` redirige a `/mercados`. Los productos se gestionan **por mercado**.

---

## 3. Mercados

**Ruta:** `/mercados`

Un **mercado** es un país donde vendes (Colombia, México, Perú, Ecuador). Cada mercado tiene:

- **Moneda** propia (COP, MXN, PEN, USD según país)
- **Pasarela:** Mercado Pago (única opción configurada)
- **Estado activo/inactivo:** si está inactivo, no aparece en el selector del sitio

### Crear o editar un mercado

1. En `/mercados`, pulsa **Nuevo mercado** o **Editar** en la fila.
2. Elige el país preset (CO, MX, PE, EC).
3. Ajusta nombre, orden de visualización y si está activo.
4. Guarda.

### Productos del mercado

Desde la tabla de mercados, entra a **Productos** de un mercado (`/mercados/[código]/productos`, ej. `/mercados/CO/productos`).

Ahí gestionas el catálogo **para ese país**: precio, stock e imágenes por versión.

---

## 4. Productos (por mercado)

**Ruta:** `/mercados/[código]/productos`

### Conceptos

| Concepto | Descripción |
| --- | --- |
| **Producto** | Nombre, slug, descripción, categoría, «destacado», activo/inactivo |
| **Versión** | Variante del producto (ej. «250 g», «500 g»). Si solo hay una, se llama «Versión única» |
| **Stock por mercado** | Precio, moneda y unidades disponibles **por versión y por país** |
| **Imágenes** | Por versión, en bucket `product-images` |

El stock y el precio que ve el cliente dependen del **mercado seleccionado** en la tienda.

### Crear un producto

1. **Nuevo producto** → completa nombre, categoría (padre + subcategoría), descripción.
2. Define al menos una **versión** con precio y stock para ese mercado.
3. Sube **imágenes** (ver [especificaciones](./whatsapp-especificaciones-imagenes.txt)).
4. Marca **Destacado** si debe aparecer en la portada (sección «Destacados por categoría»).
5. Guarda.

### Editar / eliminar

- **Editar:** modifica datos, versiones, precios, stock e imágenes.
- **Eliminar:** acción destructiva; confirma en el modal.

### Imágenes de producto

| Especificación | Valor |
| --- | --- |
| Proporción | Cuadrada **1:1** |
| Tamaño recomendado | **1200 × 1200 px** |
| Mínimo | **800 × 800 px** |
| Formatos | JPG, PNG, WebP |
| Peso máximo | 5 MB |

Puedes subir varias imágenes por versión; la primera o la marcada como principal es la de portada en listados.

---

## 5. Categorías

**Ruta:** `/categorias`

- **Categoría raíz:** grupo principal (ej. Snacks, Skincare).
- **Subcategoría:** hijo de una raíz; los productos se asignan a subcategoría.
- **Orden:** arrastra con el asa de reordenación para cambiar el orden en catálogo.
- **Activa/inactiva:** las inactivas no se muestran en la tienda.

Opción **Crear subcategoría «General»** recomendada al crear una categoría raíz nueva.

---

## 6. Destacados (hero de la portada)

**Ruta:** `/destacados`

Banners del panel derecho **«Ofertas & novedades»** en la portada. **No** son fotos de producto del catálogo.

| Campo | Uso |
| --- | --- |
| Título / subtítulo | Texto sobre la imagen |
| Imágenes | Una o varias (galería con flechas) |
| URL enlace | Destino al hacer clic (opcional) |
| Prioridad | Menor número = aparece primero |
| Inicio / fin | Programación opcional (ISO) |
| Activo | Solo los activos y dentro de fechas se muestran |

### Imágenes de banner

| Especificación | Valor |
| --- | --- |
| Proporción | **4:3** |
| Tamaño recomendado | **920 × 690 px** |
| Retina | **1840 × 1380 px** |

---

## 7. Ticker

**Ruta:** `/ticker`

Mensajes cortos que rotan en la franja bajo el header (envíos, promos, avisos).

- Texto, enlace opcional, orden y fechas de vigencia.
- `market_code` opcional: dejar vacío = global; o restringir a un país.

---

## 8. Anuncios pop-up

**Ruta:** `/anuncios`

Modales o barras al visitar el sitio.

| Modo | Comportamiento |
| --- | --- |
| `modal` | Ventana centrada |
| `toast` | Notificación tipo toast |
| `bar` | Barra fija |

Frecuencia: una vez por sesión, una vez por usuario o siempre.

---

## 9. Apariencia

**Ruta:** `/apariencia`

Ajustes visuales sin tocar código:

- **Colores de marca** (rosa, cyan, tinta, crema)
- **Hero:** badge, título, subtítulo, textos de botones
- **Footer:** tagline, copyright, redes
- **Secciones:** fondos de bloques de la portada

Los cambios se reflejan en la landing pública tras guardar.

---

## 10. Pedidos

**Ruta:** `/pedidos` · detalle: `/pedidos/[orderId]`

Estados habituales: `pending_payment` → `paid` → `processing` → `shipped` → `delivered` (también `cancelled`, `refunded`).

Desde el panel puedes **cambiar el estado**; cada cambio queda en el historial (`order_status_history`).

El cliente puede consultar `/pedido/[número]` con el número de pedido.

---

## 11. Legal

**Ruta:** `/legal` (solo admin)

Publicar nuevas versiones de **Términos y condiciones** y **Política de privacidad**. Las versiones anteriores quedan archivadas; el checkout exige aceptar la versión vigente.

---

## 12. Contáctanos

**Ruta:** `/contacto` (solo admin)

Mensajes enviados desde `/contactanos` en la tienda (nombre, email, mensaje, fecha). Puedes eliminar entradas ya atendidas.

---

## 13. Usuarios

**Ruta:** `/usuarios` (solo admin)

Asignar roles `customer`, `employee` o `admin`. No elimina cuentas de Auth; cambia el rol en `profiles`.

---

## 14. Buenas prácticas

1. **Mercado antes que producto:** activa el país y luego carga catálogo en `/mercados/XX/productos`.
2. **Stock por versión:** revisa stock en cada mercado; el carrito reserva unidades ~15 minutos.
3. **Destacados de producto vs banner:** «Destacado» en producto = carrusel por categoría; `/destacados` = banner del hero.
4. **Imágenes:** respeta las medidas del [mensaje WhatsApp](./whatsapp-especificaciones-imagenes.txt).
5. **Probar en la tienda:** usa «Ver tienda» y cambia el selector de país en el header.

---

## 15. Soporte técnico

Problemas de acceso, pagos o errores en pantalla: contactar al equipo de desarrollo con captura, URL y usuario afectado.

Documentación para desarrolladores: [docs/README.md](../README.md).
