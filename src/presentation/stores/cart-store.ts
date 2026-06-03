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
  upsertLine: (line: CartLine) => void;
  removeLine: (productId: string) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      setLines: (lines) => set({ lines }),
      upsertLine: (line) => {
        const prev = get().lines;
        const idx = prev.findIndex((l) => l.productId === line.productId);
        if (idx === -1) {
          set({ lines: [...prev, line] });
          return;
        }
        const next = [...prev];
        next[idx] = line;
        set({ lines: next });
      },
      removeLine: (productId) =>
        set({ lines: get().lines.filter((l) => l.productId !== productId) }),
    }),
    {
      name: "mks-cart-lines",
      storage: createJSONStorage(getCartStorage),
    },
  ),
);
