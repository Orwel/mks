"use client";

import { useActionState, useState } from "react";

import {
  setProfileActiveForm,
  updateProfileRoleForm,
  usuariosInitialState,
} from "@/app/(dashboard)/usuarios/actions";
import { USER_ROLES, type UserRole } from "@/core/value-objects/user-role";

const field =
  "mt-1 w-full rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1.5 text-sm font-medium text-[var(--mks-ink)]";

type Props = {
  userId: string;
  role: UserRole;
  isActive: boolean;
  isSelf: boolean;
};

export function UserRoleRow({ userId, role, isActive, isSelf }: Props) {
  const [roleState, roleAction, rolePending] = useActionState(
    updateProfileRoleForm,
    usuariosInitialState,
  );
  const [activeState, activeAction, activePending] = useActionState(
    setProfileActiveForm,
    usuariosInitialState,
  );

  // Select controlado: con `defaultValue` React conserva el valor del DOM tras
  // revalidar y la fila seguía mostrando el rol viejo aunque el cambio hubiera
  // funcionado, que es justo lo que hacía parecer que «no pasa nada».
  const [selected, setSelected] = useState<UserRole>(role);
  const [syncedRole, setSyncedRole] = useState<UserRole>(role);
  if (syncedRole !== role) {
    setSyncedRole(role);
    setSelected(role);
  }

  const feedback = roleState.status !== "idle" ? roleState : activeState;

  return (
    <div className="space-y-2">
      <form action={roleAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <label className="text-xs font-bold text-neutral-600">
          Rol
          <select
            name="role"
            value={selected}
            onChange={(e) => setSelected(e.target.value as UserRole)}
            className={field}
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={rolePending || selected === role}
          className="rounded-lg border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-3 py-1.5 text-xs font-black text-[var(--mks-ink)] disabled:opacity-50"
        >
          {rolePending ? "Guardando…" : "Actualizar rol"}
        </button>
      </form>

      <form action={activeAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="is_active" value={String(!isActive)} />
        <span className="text-xs text-neutral-500">
          Cuenta activa: {isActive ? "sí" : "no"}
        </span>
        <button
          type="submit"
          disabled={activePending || isSelf}
          title={isSelf ? "No puedes desactivar tu propia cuenta" : undefined}
          className="rounded-lg border-2 border-[var(--mks-ink)] bg-white px-2 py-1 text-[0.65rem] font-black uppercase text-[var(--mks-ink)] disabled:opacity-40"
        >
          {activePending ? "…" : isActive ? "Desactivar" : "Activar"}
        </button>
      </form>

      {feedback.status !== "idle" ? (
        <p
          role="status"
          className={
            feedback.status === "ok"
              ? "text-xs font-bold text-emerald-700"
              : "text-xs font-bold text-[var(--mks-pink)]"
          }
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
