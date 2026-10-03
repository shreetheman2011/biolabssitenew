"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ControlKnob({
  label,
  sublabel,
  description,
  open,
  disabled,
  tone = "default",
  onToggle,
}: {
  label: string;
  sublabel?: string;
  description?: string;
  open: boolean;
  disabled?: boolean;
  tone?: "default" | "heat";
  onToggle: () => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={open}
      aria-label={`${label} valve, ${open ? "open" : "closed"}`}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onToggle}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group flex flex-1 basis-32 flex-col items-center gap-2.5 rounded-md border border-border bg-background/60 px-3 py-4 transition-colors outline-none",
        !disabled && "cursor-pointer hover:border-foreground/30 focus-visible:border-foreground/50",
        disabled && "opacity-50"
      )}
    >
      <span className="relative flex size-12 items-center justify-center rounded-full border-2 border-foreground/70 bg-[radial-gradient(circle_at_35%_30%,var(--card),var(--muted)_70%)] shadow-inner">
        <span className="absolute inset-0 rounded-full border border-border/60" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={i}
            className="absolute size-0.5 rounded-full bg-border"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-21px)`,
            }}
          />
        ))}
        <motion.span
          className={cn(
            "absolute h-4 w-1 origin-bottom rounded-full",
            open
              ? tone === "heat"
                ? "bg-accent"
                : "bg-success"
              : "bg-foreground/70"
          )}
          style={{ bottom: "50%" }}
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        />
        <span className="bg-foreground/70 size-1.5 rounded-full" />
      </span>
      <span className="flex flex-col items-center gap-1">
        <span className="flex items-center gap-1 text-center text-xs font-medium leading-tight">
          {label}
          {sublabel && <span className="text-muted-foreground"> ({sublabel})</span>}
          {description && (
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`What ${label} does`}
                onClick={(e) => e.stopPropagation()}
              >
                <Info className="size-3" />
              </TooltipTrigger>
              <TooltipContent className="max-w-56 text-center">{description}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wide",
            open ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
          )}
        >
          {open ? "OPEN" : "SHUT"}
        </span>
      </span>
    </div>
  );
}
