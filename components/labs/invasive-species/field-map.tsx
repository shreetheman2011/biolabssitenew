"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bug, Fence, Fish, Flower2, ShieldHalf, Sprout, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MANAGEMENT_STRATEGIES, type ManagementStrategyId, type Scenario } from "./data";

const GLYPH_ICON: Record<Scenario, { native: LucideIcon; invasive: LucideIcon }> = {
  lake: { native: Fish, invasive: Fish },
  field: { native: Flower2, invasive: Sprout },
  forest: { native: Bug, invasive: Bug },
};

const STRATEGY_ICON: Record<ManagementStrategyId, LucideIcon> = {
  biological_control: ShieldHalf,
  trapping: Target,
  barrier: Fence,
};

function seededRand(seed: number) {
  const x = Math.sin(seed * 999.1) * 10000;
  return x - Math.floor(x);
}

function glyphPosition(index: number, salt: number) {
  const r1 = seededRand(index * 12.9898 + salt);
  const r2 = seededRand(index * 78.233 + salt * 3.7);
  return { x: 6 + r1 * 88, y: 14 + r2 * 72 };
}

function Terrain({ scenario }: { scenario: Scenario }) {
  if (scenario === "lake") {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="100" height="100" fill="color-mix(in oklch, var(--chart-1) 14%, var(--background))" />
        {[18, 34, 50, 66, 82].map((y, i) => (
          <path
            key={y}
            d={`M0,${y} Q12,${y - 3} 25,${y} T50,${y} T75,${y} T100,${y}`}
            fill="none"
            stroke="color-mix(in oklch, var(--chart-1) 40%, var(--background))"
            strokeWidth={1.2}
            opacity={0.5 - i * 0.05}
          />
        ))}
      </svg>
    );
  }
  if (scenario === "field") {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="100" height="100" fill="color-mix(in oklch, var(--chart-5) 12%, var(--background))" />
        {Array.from({ length: 60 }).map((_, i) => {
          const x = seededRand(i * 3.1) * 100;
          const y = 10 + seededRand(i * 5.7) * 80;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - 1}
              y2={y - 3}
              stroke="color-mix(in oklch, var(--chart-5) 45%, var(--background))"
              strokeWidth={0.6}
              opacity={0.6}
            />
          );
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="100" height="100" fill="color-mix(in oklch, var(--chart-4) 14%, var(--background))" />
      {Array.from({ length: 10 }).map((_, i) => {
        const x = (i / 10) * 100 + seededRand(i) * 6;
        return (
          <circle
            key={i}
            cx={x}
            cy={8 + seededRand(i * 2.2) * 10}
            r={5 + seededRand(i * 1.3) * 3}
            fill="color-mix(in oklch, var(--chart-4) 35%, var(--background))"
            opacity={0.5}
          />
        );
      })}
    </svg>
  );
}

export function FieldMap({
  scenario,
  native,
  invasive,
  appliedStrategies,
}: {
  scenario: Scenario;
  native: number;
  invasive: number;
  appliedStrategies: ManagementStrategyId[];
}) {
  const icons = GLYPH_ICON[scenario];
  const nativeCount = native > 0 ? Math.max(1, Math.min(28, Math.round(native / 20))) : 0;
  const invasiveCount = invasive > 0 ? Math.max(1, Math.min(40, Math.round(invasive / 20))) : 0;

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-md border border-border/70">
      <Terrain scenario={scenario} />

      {appliedStrategies.length > 0 && (
        <div className="absolute top-2 right-2 z-10 flex gap-1.5">
          {appliedStrategies.map((id, i) => {
            const Icon = STRATEGY_ICON[id];
            return (
              <span
                key={`${id}-${i}`}
                title={MANAGEMENT_STRATEGIES[id].label}
                className="bg-card/90 text-foreground flex size-6 items-center justify-center rounded-full border border-border shadow-sm"
              >
                <Icon className="size-3.5" />
              </span>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {Array.from({ length: nativeCount }).map((_, i) => {
          const pos = glyphPosition(i, 1);
          return (
            <motion.div
              key={`native-${i}`}
              className="absolute flex items-center justify-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.4 }}
            >
              <icons.native className="size-3.5 drop-shadow-sm" style={{ color: "var(--color-chart-5)" }} />
            </motion.div>
          );
        })}
        {Array.from({ length: invasiveCount }).map((_, i) => {
          const pos = glyphPosition(i, 7);
          return (
            <motion.div
              key={`invasive-${i}`}
              className="absolute flex items-center justify-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.4 }}
            >
              <icons.invasive className="size-3.5 drop-shadow-sm" style={{ color: "var(--color-chart-3)" }} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between px-2.5 py-1.5",
          "bg-background/85 font-mono text-[0.65rem] text-muted-foreground backdrop-blur-sm"
        )}
      >
        <span style={{ color: "var(--color-chart-5)" }}>native {native}</span>
        <span style={{ color: "var(--color-chart-3)" }}>invasive {invasive}</span>
      </div>
    </div>
  );
}
