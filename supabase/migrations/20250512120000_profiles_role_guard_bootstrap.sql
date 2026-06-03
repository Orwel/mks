-- Evitar bloqueo "huevo y gallina": sin ningún admin, nadie pasaba is_admin().
-- Además: SQL Editor y clave service_role deben poder asignar roles.

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
    -- API con service_role o sesión de mantenimiento (p. ej. SQL Editor como superusuario)
    v_elevated :=
      coalesce(auth.jwt()->>'role', '') = 'service_role'
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

    -- Primer admin: mientras no exista ningún perfil con rol admin
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
      raise exception 'Solo un administrador puede cambiar el rol';
    end if;
  end if;

  return new;
end;
$$;
