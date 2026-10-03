"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvidenceCard as EvidenceCardType } from "./data";

function pinRotation(id: string) {
  const hash = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (hash % 9) - 4;
}

export function CorkboardCard({
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
  const rotation = pinRotation(card.id);
  const pinTone =
    showCheck && isCorrect === false
      ? "var(--destructive)"
      : showCheck && isCorrect === true
        ? "var(--success)"
        : "var(--accent)";

  return (
    <motion.div
      ref={setNodeRef}
      style={{ x: transform?.x ?? 0, y: transform?.y ?? 0 }}
      animate={{ rotate: isDragging ? 0 : rotation, scale: isDragging ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn("relative w-44 shrink-0 touch-none select-none", isDragging && "z-50")}
      {...attributes}
      {...listeners}
    >
      <span
        className="absolute -top-2.5 left-1/2 z-10 size-3 -translate-x-1/2 rounded-full shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
        style={{ background: `radial-gradient(circle at 35% 30%, white, ${pinTone} 65%)` }}
      />
      <div
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "relative overflow-hidden rounded-[2px] border bg-card px-3 pt-3.5 pb-4 shadow-[0_3px_6px_rgba(0,0,0,0.12)]",
          !readOnly && "cursor-grab active:cursor-grabbing",
          isDragging && "shadow-[0_10px_20px_rgba(0,0,0,0.25)]",
          showCheck && isCorrect === true && "border-success/50",
          showCheck && isCorrect === false && "border-destructive/50",
          !(showCheck && isCorrect !== null) && "border-border/70"
        )}
      >
        <div className="flex items-start justify-between gap-1.5">
          <p className="font-display text-[0.8rem] leading-snug font-semibold">{card.title}</p>
          {showCheck &&
            (isCorrect ? (
              <Check className="text-success mt-0.5 size-3.5 shrink-0" />
            ) : (
              <X className="text-destructive mt-0.5 size-3.5 shrink-0" />
            ))}
        </div>
        {expanded ? (
          <p className="text-muted-foreground mt-2 text-[0.7rem] leading-snug">{card.detail}</p>
        ) : (
          <p className="text-muted-foreground/70 mt-1.5 text-[0.65rem] italic">Tap to read the evidence</p>
        )}
        <svg className="absolute -bottom-px left-0 h-2 w-full" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden>
          <path
            d="M0,0 L9,6 L18,1 L27,7 L36,2 L45,8 L54,1 L63,6 L72,0 L81,7 L90,2 L99,6 L108,1 L117,8 L126,2 L135,7 L144,1 L153,6 L162,0 L171,7 L180,2 L189,6 L200,1 L200,10 L0,10 Z"
            fill="var(--card)"
          />
        </svg>
      </div>
    </motion.div>
  );
}
