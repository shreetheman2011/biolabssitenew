"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ChevronDown, GripVertical, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceCard as EvidenceCardType } from "./data";

export function EvidenceCard({
  card,
  bin,
  readOnly,
  showCheck,
}: {
  card: EvidenceCardType;
  bin: "unsorted" | "supports" | "doesnt_support";
  readOnly: boolean;
  showCheck: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    disabled: readOnly,
  });

  const isCorrect = showCheck ? card.correctBin === bin : null;

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : undefined }
          : undefined
      }
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border bg-card p-3",
        isDragging && "opacity-70 shadow-lg",
        showCheck && isCorrect === true && "border-success/50 bg-success/5",
        showCheck && isCorrect === false && "border-destructive/50 bg-destructive/5"
      )}
    >
      <div className="flex items-start gap-2">
        {!readOnly && (
          <button
            type="button"
            className="text-muted-foreground mt-0.5 cursor-grab touch-none"
            {...attributes}
            {...listeners}
            aria-label="Drag to sort"
          >
            <GripVertical className="size-4" />
          </button>
        )}
        <button
          type="button"
          className="flex flex-1 items-start justify-between gap-2 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="text-sm font-medium">{card.title}</span>
          <span className="flex items-center gap-1">
            {showCheck &&
              (isCorrect ? (
                <Check className="text-success size-3.5" />
              ) : (
                <X className="text-destructive size-3.5" />
              ))}
            <ChevronDown className={cn("text-muted-foreground size-3.5 transition-transform", expanded && "rotate-180")} />
          </span>
        </button>
      </div>
      {expanded && <p className="text-muted-foreground pl-6 text-xs">{card.detail}</p>}
    </div>
  );
}
