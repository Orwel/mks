-- Subcategorías: profundidad máx 2 + migración General

create or replace function public.enforce_category_depth()
returns trigger
language plpgsql
as $$
declare
  parent_parent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select parent_id into parent_parent from public.categories where id = new.parent_id;

  if parent_parent is not null then
    raise exception 'Solo se permiten dos niveles de categoría (raíz → subcategoría)';
  end if;

  return new;
end;
$$;

drop trigger if exists categories_enforce_depth on public.categories;

create trigger categories_enforce_depth
before insert or update on public.categories
for each row execute function public.enforce_category_depth();

create index if not exists categories_parent_sort_idx on public.categories (parent_id, sort_order);

-- Subcategoría General por cada raíz sin hijos previos
insert into
  public.categories (slug, name, description, parent_id, sort_order, is_active)
select
  c.slug || '-general',
  'General',
  'Subcategoría por defecto',
  c.id,
  0,
  c.is_active
from
  public.categories c
where
  c.parent_id is null
  and not exists (
    select
      1
    from
      public.categories child
    where
      child.parent_id = c.id
  )
on conflict (slug) do nothing;

-- Reasignar productos de raíz a su subcategoría General
update public.products p
set
  category_id = child.id
from
  public.categories parent
  join public.categories child on child.parent_id = parent.id
  and child.slug = parent.slug || '-general'
where
  p.category_id = parent.id
  and parent.parent_id is null;
