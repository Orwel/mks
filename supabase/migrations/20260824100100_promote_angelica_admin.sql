-- Promoción solicitada: Angelica Diaz Segovia pasa a rol `admin`.
--
-- Se ejecuta como migración (session_user = postgres), por lo que el guard
-- `profiles_role_guard` la reconoce como sesión de mantenimiento y la permite.
--
-- Idempotente y defensiva: sólo actúa si el perfil existe, el nombre coincide y
-- todavía no es admin. En entornos donde ese perfil no exista, es un no-op.

do $$
declare
  v_target uuid := 'faef0edb-ce8e-4d79-b27c-44dc05cb57e0';
  v_updated int;
begin
  update public.profiles
  set
    role = 'admin',
    is_active = true
  where
    id = v_target
    and role is distinct from 'admin'
    and full_name ilike '%Angelica%';

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise notice 'promote_angelica_admin: sin cambios (perfil ausente o ya admin)';
  else
    raise notice 'promote_angelica_admin: perfil % promovido a admin', v_target;
  end if;
end;
$$;
