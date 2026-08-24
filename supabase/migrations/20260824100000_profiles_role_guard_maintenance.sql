-- Corrige el guard de roles de `profiles`.
--
-- Problema observado en producción:
--  1) Desde el SQL/Table Editor de Supabase el UPDATE fallaba con
--     "Solo un administrador puede cambiar el rol". La versión anterior sólo
--     permitía la excepción si `session_user` era SUPERUSUARIO, y en los
--     proyectos actuales de Supabase el rol `postgres` NO es superusuario.
--  2) Desde el panel el cambio quedaba en silencio: sin ruta de mantenimiento
--     y sin trazabilidad no había forma de distinguir "denegado" de "0 filas".
--
-- Solución: reconocer explícitamente las sesiones de mantenimiento por
-- `session_user` (que NO se ve afectado por SECURITY DEFINER, a diferencia de
-- `current_user`, que aquí siempre sería el dueño de la función) y dejar el
-- resto del guard intacto para las sesiones de usuario final vía PostgREST.

create or replace function public.profiles_prevent_role_escalation ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_elevated boolean;
begin
  if old.role is distinct from new.role then
    -- IMPORTANTE: usar `session_user`, nunca `current_user`.
    -- En una función SECURITY DEFINER `current_user` es el dueño (postgres),
    -- así que compararlo dejaría pasar a cualquiera. `session_user` conserva
    -- el rol de conexión real: `authenticator` para PostgREST (API), y
    -- `postgres` / `supabase_admin` para SQL Editor y migraciones.
    v_elevated :=
      coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or session_user in ('postgres', 'supabase_admin')
      or exists (
        select
          1
        from
          pg_roles r
        where
          r.rolname = session_user
          and r.rolsuper
      );

    if v_elevated then
      return new;
    end if;

    -- Bootstrap: mientras no exista ningún admin, permitir crear el primero.
    if not exists (
      select
        1
      from
        public.profiles p
      where
        p.role = 'admin'
    ) then
      return new;
    end if;

    if not public.is_admin () then
      raise exception 'Solo un administrador puede cambiar el rol'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- Trazabilidad de cambios de rol: quién, a quién, de qué a qué.
create or replace function public.profiles_log_role_change ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role then
    insert into public.audit_log (actor_id, action, entity_table, entity_id, metadata)
    values (
      auth.uid (),
      'profiles.role_changed',
      'profiles',
      new.id,
      jsonb_build_object(
        'from', old.role,
        'to', new.role,
        'session_user', session_user,
        'jwt_role', coalesce(auth.jwt () ->> 'role', '')
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_role_audit on public.profiles;

create trigger profiles_role_audit
after update on public.profiles
for each row
execute function public.profiles_log_role_change ();

-- RPC de respaldo: permite a un admin autenticado cambiar el rol sin depender
-- de la clave service_role (por ejemplo desde un cliente con sesión de usuario).
create or replace function public.admin_set_user_role (
  target_user_id uuid,
  new_role public.user_role
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if not public.is_admin () then
    raise exception 'Solo un administrador puede cambiar el rol'
      using errcode = '42501';
  end if;

  if target_user_id = auth.uid () and new_role <> 'admin' then
    raise exception 'Un administrador no puede quitarse a sí mismo el rol admin'
      using errcode = '42501';
  end if;

  update public.profiles
  set
    role = new_role
  where
    id = target_user_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Perfil no encontrado' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

revoke all on function public.admin_set_user_role (uuid, public.user_role) from public;

grant execute on function public.admin_set_user_role (uuid, public.user_role) to authenticated;
