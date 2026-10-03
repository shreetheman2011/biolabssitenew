"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { EvidenceCard } from "./evidence-card";
import type { EvidenceCard as EvidenceCardType, SortBin } from "./data";

export function SortZone({
  id,
  title,
  cards,
  readOnly,
  showCheck,
  className,
}: {
  id: SortBin;
  title: string;
  cards: EvidenceCardType[];
  readOnly: boolean;
  showCheck: boolean;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: readOnly });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-48 flex-col gap-2 rounded-lg border-2 border-dashed p-3 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border",
        className
      )}
    >
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      {cards.length === 0 && (
        <p className="text-muted-foreground flex-1 text-xs italic">Drop evidence cards here.</p>
      )}
      {cards.map((card) => (
        <EvidenceCard key={card.id} card={card} bin={id} readOnly={readOnly} showCheck={showCheck} />
      ))}
    </div>
  );
}
