"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

const cartNoopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getCartStorage(): StateStorage {
  return typeof window !== "undefined" ? window.localStorage : cartNoopStorage;
}

export type CartLine = {
  productId: string;
  versionId: string;
  marketCode: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  imageUrl?: string | null;
};

type CartState = {
  lines: CartLine[];
  setLines: (lines: CartLine[]) => void;
  clearCart: () => void;
  upsertLine: (line: CartLine) => void;
  removeLine: (versionId: string) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      setLines: (lines) => set({ lines }),
      clearCart: () => set({ lines: [] }),
      upsertLine: (line) => {
        const prev = get().lines;
        const idx = prev.findIndex((l) => l.versionId === line.versionId);
        if (idx === -1) {
          set({ lines: [...prev, line] });
          return;
        }
        const next = [...prev];
        next[idx] = line;
        set({ lines: next });
      },
      removeLine: (versionId) =>
        set({ lines: get().lines.filter((l) => l.versionId !== versionId) }),
    }),
    {
      name: "mks-cart-lines-v2",
      storage: createJSONStorage(getCartStorage),
    },
  ),
);
