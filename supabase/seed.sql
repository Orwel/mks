-- Datos de ejemplo (local). Ajusta o desactiva en producción.

-- Categorías
insert into
  public.categories (slug, name, description, sort_order, is_active)
values
  ('snacks', 'Snacks', 'Snacks y dulces coreanos', 1, true),
  ('skincare', 'Skincare', 'Cuidado de la piel', 2, true),
  ('bebidas', 'Bebidas', 'Tés y bebidas', 3, true)
on conflict (slug) do nothing;

-- Documentos legales iniciales (marcar current)
insert into
  public.legal_documents (type, version, content, is_current)
values
  (
    'terms',
    '1.0.0',
    'Términos y condiciones de ejemplo. Reemplazar con texto legal definitivo.',
    true
  ),
  (
    'privacy',
    '1.0.0',
    'Política de privacidad y tratamiento de datos personales (Habeas Data). Texto de ejemplo.',
    true
  )
on conflict (type, version) do update
set
  content = excluded.content,
  is_current = excluded.is_current,
  published_at = excluded.published_at,
  updated_at = now();

-- Productos demo (requiere categorías existentes)
insert into
  public.products (
    slug,
    name,
    description,
    category_id,
    price,
    stock,
    sku,
    is_featured,
    is_active
  )
select
  'chips-gochujang',
  'Chips sabor gochujang',
  'Producto de demostración',
  c.id,
  12900.00,
  50,
  'DEMO-CHIPS-001',
  true,
  true
from
  public.categories c
where
  c.slug = 'snacks'
  and not exists (
    select
      1
    from
      public.products p
    where
      p.slug = 'chips-gochujang'
  );

insert into
  public.products (
    slug,
    name,
    description,
    category_id,
    price,
    stock,
    sku,
    is_featured,
    is_active
  )
select
  'toner-centella',
  'Tónico centella asiática',
  'Producto de demostración',
  c.id,
  45900.00,
  20,
  'DEMO-TONER-001',
  true,
  true
from
  public.categories c
where
  c.slug = 'skincare'
  and not exists (
    select
      1
    from
      public.products p
    where
      p.slug = 'toner-centella'
  );

insert into
  public.ticker_messages (message, sort_order, is_active)
select
  'Envío a todo Colombia · Pagos con Mercado Pago y Stripe',
  1,
  true
where
  not exists (
    select
      1
    from
      public.ticker_messages t
    where
      t.message = 'Envío a todo Colombia · Pagos con Mercado Pago y Stripe'
  );
