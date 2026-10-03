"use client";

import { useDraggable } from "@dnd-kit/core";
import { Bird, Bug, Fish, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Organism, TrophicLevel } from "./data";

const LEVEL_ICONS: Record<TrophicLevel, typeof Leaf> = {
  producer: Leaf,
  primary: Bug,
  secondary: Fish,
  tertiary: Bird,
};

export function OrganismCard({ organism, disabled }: { organism: Organism; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: organism.id,
    disabled,
  });
  const Icon = LEVEL_ICONS[organism.level];

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : undefined } : undefined}
      {...attributes}
      {...listeners}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm",
        !disabled && "cursor-grab touch-none",
        isDragging && "opacity-70 shadow-lg"
      )}
    >
      <Icon className="text-primary size-4" />
      {organism.label}
    </button>
  );
}
