import { GripVertical } from "lucide-react";
import type { HTMLAttributes } from "react";

type Props = {
  dragHandleProps?: HTMLAttributes<HTMLSpanElement> & { draggable?: boolean };
};

export function SortableDragHandle({ dragHandleProps }: Props) {
  return (
    <span
      {...dragHandleProps}
      className="inline-flex cursor-grab touch-none text-neutral-400 active:cursor-grabbing"
      aria-hidden
    >
      <GripVertical className="size-4" strokeWidth={2.5} />
    </span>
  );
}
