"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `true` sólo después de la hidratación en el cliente.
 *
 * Sustituye al patrón `useEffect(() => setMounted(true), [])`, que provoca un
 * render en cascada extra en cada montaje. `useSyncExternalStore` resuelve el
 * valor durante el render, sin estado ni efecto.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
