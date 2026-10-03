"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LeverSwitch({
  label,
  description,
  on,
  disabled,
  hazard,
  onToggle,
}: {
  label: string;
  description: string;
  on: boolean;
  disabled?: boolean;
  hazard?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-md border border-border bg-background/60 p-3.5 text-left transition-colors",
        !disabled && "cursor-pointer hover:border-foreground/30",
        disabled && "opacity-50"
      )}
    >
      <span
        className={cn(
          "relative flex h-12 w-8 shrink-0 items-start justify-center rounded-sm border-2 p-1",
          hazard ? "border-accent/60" : "border-foreground/40 bg-muted"
        )}
        style={
          hazard
            ? {
                backgroundImage:
                  "repeating-linear-gradient(135deg, color-mix(in oklch, var(--accent) 22%, transparent) 0, color-mix(in oklch, var(--accent) 22%, transparent) 3px, transparent 3px, transparent 7px)",
                backgroundColor: "color-mix(in oklch, var(--accent) 8%, var(--background))",
              }
            : undefined
        }
      >
        <motion.span
          className="z-10 flex h-5 w-5 items-center justify-center rounded-sm border border-foreground/60 bg-card shadow-sm"
          animate={{ y: on ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <span className={cn("size-1.5 rounded-full", on ? "bg-success" : "bg-destructive")} />
        </motion.span>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span
            className={cn(
              "shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wide",
              on ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
            )}
          >
            {on ? "ENGAGED" : "OFF"}
          </span>
        </span>
        <span className="text-muted-foreground text-xs leading-snug">{description}</span>
      </span>
    </button>
  );
}
