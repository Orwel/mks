create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "contact_messages_insert_public" on public.contact_messages
  for insert
  with check (true);

create policy "contact_messages_select_admin" on public.contact_messages
  for select
  using (public.is_admin());

create policy "contact_messages_delete_admin" on public.contact_messages
  for delete
  using (public.is_admin());
