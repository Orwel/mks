-- Marketing segmentado por mercado (NULL = global)

alter table public.banners
add column if not exists market_code text references public.markets (code) on delete set null;

alter table public.ticker_messages
add column if not exists market_code text references public.markets (code) on delete set null;

alter table public.announcements
add column if not exists market_code text references public.markets (code) on delete set null;

create index if not exists banners_market_active_idx on public.banners (market_code, is_active, sort_order);

create index if not exists ticker_messages_market_active_idx on public.ticker_messages (market_code, is_active, sort_order);

create index if not exists announcements_market_active_idx on public.announcements (market_code, is_active, sort_order);
