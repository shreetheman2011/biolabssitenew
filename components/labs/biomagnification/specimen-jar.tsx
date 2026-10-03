"use client";

import { useDroppable } from "@dnd-kit/core";
import { Bird, Bug, Fish, Info, Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TROPHIC_LEVEL_DESCRIPTIONS, TROPHIC_LEVEL_LABELS, type Organism, type TrophicLevel } from "./data";

const LEVEL_ICONS: Record<TrophicLevel, typeof Leaf> = {
  producer: Leaf,
  primary: Bug,
  secondary: Fish,
  tertiary: Bird,
};

const VB_W = 84;
const VB_H = 100;
const JAR_TOP = 18;
const JAR_BOTTOM = 86;

function liquidFraction(concentration: number) {
  return Math.min(1, Math.sqrt(concentration) / Math.sqrt(60));
}

export function SpecimenJar({
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
  const filled = !!organism;
  const fraction = concentration !== null ? liquidFraction(concentration) : 0;
  const liquidY = JAR_BOTTOM - fraction * (JAR_BOTTOM - JAR_TOP - 8);
  const tintPct = concentration !== null ? 25 + Math.min(1, concentration / 40) * 55 : 0;
  const clipId = `jar-clip-${level}`;

  const jarPath = `M ${VB_W / 2 - 18} 14
    L ${VB_W / 2 - 18} 20
    Q ${VB_W / 2 - 26} 24 ${VB_W / 2 - 26} 36
    L ${VB_W / 2 - 26} 78
    Q ${VB_W / 2 - 26} 86 ${VB_W / 2 - 18} 86
    L ${VB_W / 2 + 18} 86
    Q ${VB_W / 2 + 26} 86 ${VB_W / 2 + 26} 78
    L ${VB_W / 2 + 26} 36
    Q ${VB_W / 2 + 26} 24 ${VB_W / 2 + 18} 20
    L ${VB_W / 2 + 18} 14 Z`;

  const liquidClipPath = `M ${VB_W / 2 - 26} 36
    L ${VB_W / 2 - 26} 78
    Q ${VB_W / 2 - 26} 86 ${VB_W / 2 - 18} 86
    L ${VB_W / 2 + 18} 86
    Q ${VB_W / 2 + 26} 86 ${VB_W / 2 + 26} 78
    L ${VB_W / 2 + 26} 36 Z`;

  return (
    <div ref={setNodeRef} className="flex flex-col items-center gap-1.5">
      <div className="relative h-28 w-20">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
          {filled && <rect x={VB_W / 2 - 15} y={6} width={30} height={8} rx={2} fill="var(--border)" />}
          <clipPath id={clipId}>
            <path d={liquidClipPath} />
          </clipPath>
          {filled && concentration !== null && (
            <>
              <rect
                x={VB_W / 2 - 26}
                y={liquidY}
                width={52}
                height={JAR_BOTTOM - liquidY + 4}
                clipPath={`url(#${clipId})`}
                fill={`color-mix(in oklch, var(--chart-3) ${tintPct}%, var(--background))`}
                style={{ transition: "y 200ms ease-out" }}
              />
              <ellipse
                cx={VB_W / 2}
                cy={liquidY}
                rx={26}
                ry={2}
                clipPath={`url(#${clipId})`}
                fill={`color-mix(in oklch, var(--chart-3) ${tintPct + 10}%, var(--background))`}
                style={{ transition: "cy 200ms ease-out" }}
              />
            </>
          )}
          <path
            d={jarPath}
            fill={isOver ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent"}
            stroke={isOver ? "var(--primary)" : "var(--border)"}
            strokeWidth={1.5}
            strokeDasharray={filled ? undefined : "4 3"}
          />
        </svg>
        {filled && (
          <Icon
            className="absolute size-4 -translate-x-1/2 -translate-y-1/2 text-foreground drop-shadow-sm transition-[top] duration-200"
            style={{ left: "50%", top: `${liquidY - 6}%` }}
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5 rounded-sm border border-border bg-muted/40 px-2 py-1 text-center">
        <span className="flex items-center gap-1 text-muted-foreground text-[0.65rem] font-medium">
          {TROPHIC_LEVEL_LABELS[level]}
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`What a ${TROPHIC_LEVEL_LABELS[level].toLowerCase()} is`}
            >
              <Info className="size-2.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-center">{TROPHIC_LEVEL_DESCRIPTIONS[level]}</TooltipContent>
          </Tooltip>
        </span>
        {organism ? (
          <>
            <span className="text-xs font-medium">{organism.label}</span>
            {concentration !== null && (
              <span className="text-muted-foreground font-mono text-[0.65rem]">{concentration.toFixed(2)} ppm</span>
            )}
            {!readOnly && (
              <Button variant="ghost" size="sm" onClick={onRemove} className={cn("h-5 px-1.5 text-[0.65rem]")}>
                <X className="size-2.5" />
              </Button>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-[0.65rem] italic">empty jar</span>
        )}
      </div>
    </div>
  );
}
