"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { CorkboardCard } from "./corkboard-card";
import type { EvidenceCard as EvidenceCardType, SortBin } from "./data";

export function CorkboardZone({
  id,
  title,
  cards,
  readOnly,
  showCheck,
  tone = "neutral",
  className,
}: {
  id: SortBin;
  title: string;
  cards: EvidenceCardType[];
  readOnly: boolean;
  showCheck: boolean;
  tone?: "neutral" | "supports" | "doesnt_support";
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: readOnly });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex min-h-56 flex-col gap-3 rounded-sm border p-3.5 transition-shadow",
        "bg-[radial-gradient(circle_at_18%_22%,color-mix(in_oklch,white_6%,transparent),transparent_40%),repeating-linear-gradient(115deg,color-mix(in_oklch,black_5%,transparent)_0,color-mix(in_oklch,black_5%,transparent)_2px,transparent_2px,transparent_5px)]",
        isOver && "ring-2 ring-accent/70 ring-inset",
        className
      )}
      style={{
        backgroundColor: "color-mix(in oklch, var(--accent) 55%, var(--foreground) 42%)",
        borderColor: "color-mix(in oklch, var(--foreground) 55%, var(--accent) 20%)",
        boxShadow: "inset 0 0 0 1px color-mix(in oklch, white 8%, transparent), inset 0 2px 10px color-mix(in oklch, black 28%, transparent)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-[2px] px-2 py-0.5 font-mono text-[0.65rem] tracking-wide uppercase shadow-sm",
            tone === "supports" && "bg-success/85 text-success-foreground",
            tone === "doesnt_support" && "bg-destructive/85 text-destructive-foreground",
            tone === "neutral" && "bg-[color-mix(in_oklch,var(--warning)_25%,white_75%)] text-[color-mix(in_oklch,var(--foreground)_80%,var(--warning)_20%)]"
          )}
        >
          {title}
        </span>
        <span className="font-mono text-[0.65rem]" style={{ color: "color-mix(in oklch, white 55%, transparent)" }}>
          {cards.length}
        </span>
      </div>
      <div className="flex flex-1 flex-wrap content-start gap-x-3 gap-y-5 pt-1">
        {cards.length === 0 && (
          <p className="text-[0.7rem] italic" style={{ color: "color-mix(in oklch, white 45%, transparent)" }}>
            Pin evidence cards here.
          </p>
        )}
        {cards.map((card) => (
          <CorkboardCard key={card.id} card={card} bin={id} readOnly={readOnly} showCheck={showCheck} />
        ))}
      </div>
    </div>
  );
}
