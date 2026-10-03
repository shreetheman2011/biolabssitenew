"use client";

import { useDroppable } from "@dnd-kit/core";
import { Bird, Bug, Fish, Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TROPHIC_LEVEL_LABELS, type Organism, type TrophicLevel } from "./data";

const LEVEL_ICONS: Record<TrophicLevel, typeof Leaf> = {
  producer: Leaf,
  primary: Bug,
  secondary: Fish,
  tertiary: Bird,
};

export function FoodChainSlot({
  level,
  organism,
  concentration,
  readOnly,
  onRemove,
}: {
  level: TrophicLevel;
  organism: Organism | null;
  concentration: number | null;
  readOnly: boolean;
  onRemove: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: level, disabled: readOnly || !!organism });
  const Icon = LEVEL_ICONS[level];
  const meterHeight = concentration !== null ? Math.min(96, 12 + Math.sqrt(concentration) * 14) : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 flex-1 flex-col items-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <p className="text-muted-foreground text-center text-xs font-medium">
        {TROPHIC_LEVEL_LABELS[level]}
      </p>
      {organism ? (
        <>
          <div className="relative flex flex-1 flex-col items-center justify-end">
            <div
              className="w-6 rounded-t-sm bg-destructive/60"
              style={{ height: meterHeight }}
              aria-hidden
            />
          </div>
          <Icon className="text-primary size-6" />
          <p className="text-center text-sm font-medium">{organism.label}</p>
          {concentration !== null && (
            <p className="text-muted-foreground text-xs">{concentration.toFixed(2)} ppm</p>
          )}
          {!readOnly && (
            <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 px-2 text-xs">
              <X className="size-3" />
              Remove
            </Button>
          )}
        </>
      ) : (
        <p className="text-muted-foreground flex-1 text-center text-xs italic">
          Drop a {TROPHIC_LEVEL_LABELS[level].toLowerCase()} here
        </p>
      )}
    </div>
  );
}
