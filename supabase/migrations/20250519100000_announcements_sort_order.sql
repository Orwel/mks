-- Prioridad de anuncios pop-up (menor = primero)
alter table public.announcements
add column if not exists sort_order int not null default 0;

create index if not exists announcements_active_sort_idx
on public.announcements (is_active, sort_order asc, created_at desc);
