-- Fuente única de verdad para los actos jurídicos (T&C y Política de privacidad).
--
-- Los textos viven SÓLO en `legal_documents`: la web pública, el checkout y el
-- registro leen la fila `is_current = true` de cada tipo. No hay copias en
-- código ni en `site_settings`.
--
-- `legal_acceptances` pasa a registrar también la aceptación hecha en el
-- registro de usuario, con la versión exacta, marca de tiempo, IP y user agent.

-- 1. Metadatos de publicación del documento -----------------------------------

alter table public.legal_documents
  add column if not exists title text not null default '';

alter table public.legal_documents
  add column if not exists effective_date date;

comment on table public.legal_documents is
  'Fuente única de verdad de los textos legales. Una fila is_current=true por tipo.';

-- 2. Origen y detalle de la aceptación ----------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'legal_acceptance_source') then
    create type public.legal_acceptance_source as enum (
      'registration',
      'checkout',
      'account_update'
    );
  end if;
end;
$$;

alter table public.legal_acceptances
  add column if not exists source public.legal_acceptance_source not null default 'checkout';

alter table public.legal_acceptances
  add column if not exists terms_version text;

alter table public.legal_acceptances
  add column if not exists privacy_version text;

-- Casillas independientes: la Ley 1581 de 2012 exige autorización previa,
-- expresa e informada para el tratamiento de datos; no puede ir refundida en
-- la aceptación del contrato de compraventa.
alter table public.legal_acceptances
  add column if not exists accepted_terms boolean not null default true;

alter table public.legal_acceptances
  add column if not exists accepted_privacy boolean not null default true;

alter table public.legal_acceptances
  add column if not exists marketing_opt_in boolean not null default false;

create index if not exists legal_acceptances_source_idx
  on public.legal_acceptances (source, accepted_at desc);

comment on table public.legal_acceptances is
  'Evidencia de aceptación: versión exacta de cada documento, fecha, IP y user agent. Append-only.';

-- 3. Trazabilidad: nunca borrar ni reescribir una aceptación -------------------

drop policy if exists "legal_acceptances_no_update" on public.legal_acceptances;
drop policy if exists "legal_acceptances_no_delete" on public.legal_acceptances;

-- Sin políticas de UPDATE/DELETE, RLS las deniega para anon/authenticated.
-- El service_role sigue pudiendo corregir datos si hiciera falta.

-- 4. Snapshot automático de versiones -----------------------------------------

create or replace function public.legal_acceptances_fill_versions ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.terms_version is null then
    select d.version into new.terms_version
    from public.legal_documents d
    where d.id = new.terms_document_id;
  end if;

  if new.privacy_version is null then
    select d.version into new.privacy_version
    from public.legal_documents d
    where d.id = new.privacy_document_id;
  end if;

  return new;
end;
$$;

drop trigger if exists legal_acceptances_versions on public.legal_acceptances;

create trigger legal_acceptances_versions
before insert on public.legal_acceptances
for each row
execute function public.legal_acceptances_fill_versions ();

-- 5. Vista de consulta para el panel ------------------------------------------

create or replace view public.legal_acceptances_detailed as
select
  a.id,
  a.user_id,
  a.email,
  a.source,
  a.accepted_at,
  a.accepted_terms,
  a.accepted_privacy,
  a.marketing_opt_in,
  a.ip_address,
  a.user_agent,
  coalesce(a.terms_version, t.version) as terms_version,
  coalesce(a.privacy_version, p.version) as privacy_version,
  a.terms_document_id,
  a.privacy_document_id,
  pr.full_name
from
  public.legal_acceptances a
  left join public.legal_documents t on t.id = a.terms_document_id
  left join public.legal_documents p on p.id = a.privacy_document_id
  left join public.profiles pr on pr.id = a.user_id;

-- La vista hereda los permisos del invocador (Postgres 15: security_invoker).
alter view public.legal_acceptances_detailed set (security_invoker = on);

grant select on public.legal_acceptances_detailed to authenticated;
