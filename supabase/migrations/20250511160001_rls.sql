-- RLS y políticas — My Korea Store

-- Protección: solo admin cambia rol en profiles
create or replace function public.profiles_prevent_role_escalation ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    if not public.is_admin () then
      raise exception 'Solo un administrador puede cambiar el rol';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
before update on public.profiles
for each row
execute function public.profiles_prevent_role_escalation ();

-- Activar RLS
alter table public.profiles enable row level security;

alter table public.categories enable row level security;

alter table public.products enable row level security;

alter table public.product_images enable row level security;

alter table public.currency_rates enable row level security;

alter table public.legal_documents enable row level security;

alter table public.legal_acceptances enable row level security;

alter table public.orders enable row level security;

alter table public.order_items enable row level security;

alter table public.order_status_history enable row level security;

alter table public.stock_reservations enable row level security;

alter table public.banners enable row level security;

alter table public.ticker_messages enable row level security;

alter table public.announcements enable row level security;

alter table public.webhook_events enable row level security;

alter table public.audit_log enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles for
select
  using (id = auth.uid () or public.is_admin ());

create policy "profiles_update_own" on public.profiles for
update
  using (id = auth.uid ())
  with check (id = auth.uid ());

create policy "profiles_update_admin" on public.profiles for
update
  using (public.is_admin ())
  with check (public.is_admin ());

-- categories
create policy "categories_select_public" on public.categories for
select
  using (is_active = true or public.is_staff ());

create policy "categories_write_staff" on public.categories for all using (public.is_staff ())
with check (public.is_staff ());

-- products
create policy "products_select_public" on public.products for
select
  using (is_active = true or public.is_staff ());

create policy "products_write_staff" on public.products for all using (public.is_staff ())
with check (public.is_staff ());

-- product_images
create policy "product_images_select" on public.product_images for
select
  using (
    exists (
      select
        1
      from
        public.products p
      where
        p.id = product_id
        and (
          p.is_active = true
          or public.is_staff ()
        )
    )
  );

create policy "product_images_write_staff" on public.product_images for all using (public.is_staff ())
with check (public.is_staff ());

-- currency_rates (lectura pública de tasas publicadas)
create policy "currency_rates_select_all" on public.currency_rates for
select
  using (true);

create policy "currency_rates_write_staff" on public.currency_rates for all using (public.is_admin ())
with check (public.is_admin ());

-- legal_documents
create policy "legal_documents_select_public_current" on public.legal_documents for
select
  using (is_current = true or public.is_staff ());

create policy "legal_documents_write_admin" on public.legal_documents for all using (public.is_admin ())
with check (public.is_admin ());

-- legal_acceptances
create policy "legal_acceptances_select_own_or_admin" on public.legal_acceptances for
select
  using (
    user_id = auth.uid ()
    or public.is_admin ()
  );

create policy "legal_acceptances_insert_authenticated" on public.legal_acceptances for insert
with check (
  user_id is null
  or user_id = auth.uid ()
);

-- orders (altas preferentemente con service_role desde el backend)
create policy "orders_select_owner_or_staff" on public.orders for
select
  using (user_id = auth.uid () or public.is_staff ());

create policy "orders_insert_authenticated" on public.orders for insert
with check (
  user_id = auth.uid ()
  or user_id is null
);

create policy "orders_update_staff" on public.orders for
update
  using (public.is_staff ())
  with check (public.is_staff ());

-- order_items
create policy "order_items_select_visible_order" on public.order_items for
select
  using (
    exists (
      select
        1
      from
        public.orders o
      where
        o.id = order_id
        and (
          o.user_id = auth.uid ()
          or public.is_staff ()
        )
    )
  );

create policy "order_items_write_staff" on public.order_items for all using (public.is_staff ())
with check (public.is_staff ());

-- order_status_history
create policy "order_status_history_select_visible" on public.order_status_history for
select
  using (
    exists (
      select
        1
      from
        public.orders o
      where
        o.id = order_id
        and (
          o.user_id = auth.uid ()
          or public.is_staff ()
        )
    )
  );

create policy "order_status_history_write_staff" on public.order_status_history for insert
with check (public.is_staff ());

-- stock_reservations: sin políticas → acceso directo denegado; reserve_stock (SECURITY DEFINER) escribe

-- banners / ticker / announcements
create policy "banners_select" on public.banners for
select
  using (
    public.is_staff ()
    or (
      is_active = true
      and (
        starts_at is null
        or starts_at <= now()
      )
      and (
        ends_at is null
        or ends_at >= now()
      )
    )
  );

create policy "banners_write_staff" on public.banners for all using (public.is_staff ())
with check (public.is_staff ());

create policy "ticker_select" on public.ticker_messages for
select
  using (
    public.is_staff ()
    or (
      is_active = true
      and (
        starts_at is null
        or starts_at <= now()
      )
      and (
        ends_at is null
        or ends_at >= now()
      )
    )
  );

create policy "ticker_write_staff" on public.ticker_messages for all using (public.is_staff ())
with check (public.is_staff ());

create policy "announcements_select" on public.announcements for
select
  using (
    public.is_staff ()
    or (
      is_active = true
      and (
        starts_at is null
        or starts_at <= now()
      )
      and (
        ends_at is null
        or ends_at >= now()
      )
    )
  );

create policy "announcements_write_staff" on public.announcements for all using (public.is_staff ())
with check (public.is_staff ());

-- webhooks / auditoría: RLS sin políticas → solo service_role o bypass
