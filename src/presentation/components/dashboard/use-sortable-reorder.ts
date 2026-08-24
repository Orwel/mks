"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { reorderByIndex } from "./sortable-reorder";

type ItemWithId = { id: string };

export function useSortableReorder<T extends ItemWithId>(
  initialItems: T[],
  persistOrder: (orderedIds: string[]) => Promise<void>,
) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Resincronizar con el servidor tras revalidar. Se hace durante el render
  // (patrón oficial de React para estado derivado de props) en vez de con un
  // efecto: así la lista nueva se pinta en el mismo render y el panel no se
  // queda un instante mostrando el orden viejo.
  const [syncedItems, setSyncedItems] = useState(initialItems);
  if (syncedItems !== initialItems) {
    setSyncedItems(initialItems);
    const sameOrder =
      items.length === initialItems.length &&
      items.every((item, i) => item.id === initialItems[i]?.id);
    if (!sameOrder) {
      setItems(initialItems);
    }
  }

  const saveOrder = useCallback(
    (ordered: T[]) => {
      startTransition(async () => {
        await persistOrder(ordered.map((item) => item.id));
        router.refresh();
      });
    },
    [persistOrder, router],
  );

  const onDragStart = (index: number) => {
    setDragIndex(index);
    setDropIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDropIndex(index);
  };

  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    const reordered = reorderByIndex(items, dragIndex, index);
    setItems(reordered);
    setDragIndex(null);
    setDropIndex(null);
    saveOrder(reordered);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const rowDragProps = (index: number, rowClassName?: string) => {
    const highlight =
      dragIndex === index
        ? "opacity-40"
        : dropIndex === index && dragIndex !== null
          ? "bg-[var(--mks-cyan)]/25"
          : undefined;
    const className = [rowClassName, highlight].filter(Boolean).join(" ") || undefined;

    return {
      onDragOver: (e: React.DragEvent) => onDragOver(e, index),
      onDrop: () => onDrop(index),
      onDragEnd,
      className,
    };
  };

  const handleDragProps = (index: number) => ({
    draggable: true,
    onDragStart: () => onDragStart(index),
    onDragEnd,
  });

  return { items, isPending, rowDragProps, handleDragProps };
}
