-- Catálogo MKS: categorías raíz y subcategorías

-- 1) Categorías raíz
insert into public.categories (slug, name, description, parent_id, sort_order, is_active)
values
  (
    'k-beauty',
    'K-BEAUTY',
    'Belleza coreana que transforma tu rutina. Descubre skincare, maquillaje y cuidado capilar con los mejores productos de Corea.',
    null,
    1,
    true
  ),
  (
    'k-pop',
    'K-POP',
    'Todo lo que un verdadero fan necesita. Encuentra álbumes, lightsticks, photocards, coleccionables y mercancía oficial de tus artistas favoritos para vivir tu fandom más cerca que nunca.',
    null,
    2,
    true
  ),
  (
    'k-food',
    'K-FOOD',
    'Los sabores que conquistan al mundo. Explora una selección de ramen, snacks, bebidas y productos tradicionales coreanos para disfrutar Corea desde cualquier lugar de Latinoamérica.',
    null,
    3,
    true
  ),
  (
    'k-wellness',
    'K-WELLNESS',
    'Bienestar inspirado en la filosofía coreana del cuidado integral. Descubre suplementos, colágeno, alimentos funcionales y productos diseñados para acompañar un estilo de vida saludable.',
    null,
    4,
    true
  ),
  (
    'k-fashion',
    'K-FASHION',
    'Las tendencias desde Seúl llegan a tu clóset. Descubre prendas, accesorios y básicos inspirados en una de las escenas de moda más influyentes del mundo.',
    null,
    5,
    true
  ),
  (
    'k-lifestyle',
    'K-LIFESTYLE',
    'Pequeños detalles que hacen parte del estilo de vida coreano. Encuentra artículos para el hogar, papelería, accesorios y productos que te conectan con Corea en tu día a día.',
    null,
    6,
    true
  ),
  (
    'nuevos-en-corea',
    'NUEVOS EN COREA',
    'Recién llegados desde Corea. Descubre lanzamientos, productos en tendencia y novedades seleccionadas especialmente para nuestra comunidad.',
    null,
    7,
    true
  ),
  (
    'favoritos-comunidad',
    'FAVORITOS DE LA COMUNIDAD',
    'Los productos más amados por los K-Lovers. Explora los artículos más vendidos y recomendados por nuestra comunidad en toda Latinoamérica.',
    null,
    8,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- 2) Subcategorías
insert into public.categories (slug, name, description, parent_id, sort_order, is_active)
select
  v.slug,
  v.name,
  null,
  p.id,
  v.sort_order,
  true
from
  (
    values
      -- K-BEAUTY
      ('k-beauty', 'k-beauty-skincare', 'Skincare', 1),
      ('k-beauty', 'k-beauty-maquillaje', 'Maquillaje', 2),
      ('k-beauty', 'k-beauty-proteccion-solar', 'Protección Solar', 3),
      ('k-beauty', 'k-beauty-mascarillas', 'Mascarillas', 4),
      ('k-beauty', 'k-beauty-limpieza-facial', 'Limpieza Facial', 5),
      ('k-beauty', 'k-beauty-serums-tratamientos', 'Sérums y Tratamientos', 6),
      ('k-beauty', 'k-beauty-herramientas-belleza', 'Herramientas de Belleza', 7),
      ('k-beauty', 'k-beauty-cuidado-capilar', 'Cuidado Capilar', 8),
      -- K-POP
      ('k-pop', 'k-pop-albumes', 'Álbumes', 1),
      ('k-pop', 'k-pop-lightsticks', 'Lightsticks', 2),
      ('k-pop', 'k-pop-photocards', 'Photocards', 3),
      ('k-pop', 'k-pop-coleccionables', 'Coleccionables', 4),
      ('k-pop', 'k-pop-merch-oficial', 'Merch Oficial', 5),
      ('k-pop', 'k-pop-ediciones-especiales', 'Ediciones Especiales', 6),
      -- K-FOOD
      ('k-food', 'k-food-ramen', 'Ramen', 1),
      ('k-food', 'k-food-snacks', 'Snacks', 2),
      ('k-food', 'k-food-bebidas', 'Bebidas', 3),
      ('k-food', 'k-food-salsas', 'Salsas', 4),
      ('k-food', 'k-food-comidas-instantaneas', 'Comidas Instantáneas', 5),
      ('k-food', 'k-food-productos-tradicionales', 'Productos Tradicionales', 6),
      -- K-WELLNESS
      ('k-wellness', 'k-wellness-colageno', 'Colágeno', 1),
      ('k-wellness', 'k-wellness-vitaminas', 'Vitaminas', 2),
      ('k-wellness', 'k-wellness-ginseng', 'Ginseng', 3),
      ('k-wellness', 'k-wellness-probioticos', 'Probióticos', 4),
      ('k-wellness', 'k-wellness-bienestar-diario', 'Bienestar Diario', 5),
      ('k-wellness', 'k-wellness-packs-wellness', 'Packs Wellness', 6),
      -- K-FASHION
      ('k-fashion', 'k-fashion-ropa', 'Ropa', 1),
      ('k-fashion', 'k-fashion-accesorios', 'Accesorios', 2),
      ('k-fashion', 'k-fashion-bolsos', 'Bolsos', 3),
      ('k-fashion', 'k-fashion-joyeria', 'Joyería', 4),
      ('k-fashion', 'k-fashion-colecciones-especiales', 'Colecciones Especiales', 5),
      -- K-LIFESTYLE
      ('k-lifestyle', 'k-lifestyle-hogar', 'Hogar', 1),
      ('k-lifestyle', 'k-lifestyle-papeleria', 'Papelería', 2),
      ('k-lifestyle', 'k-lifestyle-decoracion', 'Decoración', 3),
      ('k-lifestyle', 'k-lifestyle-tecnologia', 'Tecnología', 4),
      ('k-lifestyle', 'k-lifestyle-regalos', 'Regalos', 5),
      -- Raíces sin subcategorías explícitas
      ('nuevos-en-corea', 'nuevos-en-corea-general', 'General', 0),
      ('favoritos-comunidad', 'favoritos-comunidad-general', 'General', 0)
  ) as v (parent_slug, slug, name, sort_order)
  join public.categories p on p.slug = v.parent_slug
  and p.parent_id is null
on conflict (slug) do update
set
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- 3) Reasignar productos demo existentes a subcategorías nuevas
update public.products p
set
  category_id = c.id,
  updated_at = now()
from
  public.categories c
where
  p.slug = 'chips-gochujang'
  and c.slug = 'k-food-snacks';

update public.products p
set
  category_id = c.id,
  updated_at = now()
from
  public.categories c
where
  p.slug = 'toner-centella'
  and c.slug = 'k-beauty-skincare';

update public.products p
set
  category_id = c.id,
  updated_at = now()
from
  public.categories c
where
  p.slug = 'imagen-prueba'
  and c.slug = 'nuevos-en-corea-general';

-- 4) Desactivar categorías demo anteriores
update public.categories
set
  is_active = false,
  updated_at = now()
where
  slug in (
    'snacks',
    'snacks-general',
    'skincare',
    'skincare-general',
    'bebidas',
    'bebidas-general',
    'prueba-categoria',
    'prueba-categoria-general'
  );
