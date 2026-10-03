"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Check, GripVertical, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StageIllustration } from "./stage-illustration";
import type { TimelineStage } from "./data";

export function SlideFrame({
  stage,
  index,
  note,
  onNoteChange,
  readOnly,
  correct,
}: {
  stage: TimelineStage;
  index: number;
  note: string;
  onNoteChange: (value: string) => void;
  readOnly: boolean;
  correct?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, backgroundColor: "#111214" }}
      className={cn(
        "relative flex gap-0 rounded-[3px] border-4 transition-shadow",
        isDragging && "z-10 shadow-[0_14px_28px_rgba(0,0,0,0.5)]",
        correct === true && "border-success/70",
        correct === false && "border-destructive/70",
        correct === undefined && "border-[#1c1c1c]"
      )}
    >
      {[0, 1].map((side) => (
        <div
          key={side}
          className="flex w-3 shrink-0 flex-col justify-around py-1"
          aria-hidden
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="mx-auto h-1.5 w-1.5 rounded-[1px]" style={{ backgroundColor: "#0a0a0b" }} />
          ))}
        </div>
      ))}

      <div
        className="flex flex-1 items-stretch gap-3 px-1 py-3"
        style={{
          backgroundColor: "color-mix(in oklch, var(--warning) 18%, white 82%)",
        }}
      >
        <div
          className="flex shrink-0 flex-col items-center justify-center gap-1.5 rounded-[2px] px-3"
          style={{ backgroundColor: "color-mix(in oklch, var(--warning) 10%, white 90%)" }}
        >
          <span className="font-mono text-[0.6rem] tracking-wide text-[#6b5a2f]">FRAME {index + 1}</span>
          <StageIllustration stageId={stage.id} />
          {correct === true && <Check className="text-success size-4" />}
          {correct === false && <X className="text-destructive size-4" />}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5 pr-2">
          <p className="font-display text-[0.9rem] leading-tight font-semibold text-[#2a2410]">{stage.title}</p>
          <p className="text-[0.72rem] leading-snug text-[#2a2410]/70">{stage.description}</p>
          <Textarea
            rows={2}
            placeholder="What does the host cell and the prokaryote each need at this stage to survive?"
            value={note}
            disabled={readOnly}
            onChange={(e) => onNoteChange(e.target.value)}
            className="mt-1 border-[#2a2410]/20 bg-white/60 text-[0.8rem] text-[#2a2410] placeholder:text-[#2a2410]/40"
          />
        </div>

        {!readOnly && (
          <button
            type="button"
            className="flex shrink-0 cursor-grab touch-none items-center text-[#2a2410]/50 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
