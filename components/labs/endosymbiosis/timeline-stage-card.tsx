"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { TimelineStage } from "./data";

export function TimelineStageCard({
  stage,
  index,
  note,
  onNoteChange,
  readOnly,
}: {
  stage: TimelineStage;
  index: number;
  note: string;
  onNoteChange: (value: string) => void;
  readOnly: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex gap-3 rounded-lg border bg-card p-4",
        isDragging && "z-10 opacity-70 shadow-lg"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-semibold">
          {index + 1}
        </span>
        {!readOnly && (
          <button
            type="button"
            className="text-muted-foreground cursor-grab touch-none"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <p className="font-display text-sm font-semibold">{stage.title}</p>
        <p className="text-muted-foreground text-xs">{stage.description}</p>
        <Textarea
          rows={2}
          placeholder="What does the host cell and the prokaryote each need at this stage to survive?"
          value={note}
          disabled={readOnly}
          onChange={(e) => onNoteChange(e.target.value)}
          className="text-sm"
        />
      </div>
    </div>
  );
}
