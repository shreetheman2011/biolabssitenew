"use client";

import { Fish, Flower2, TreePine, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENARIOS, type Scenario } from "./data";

const SCENARIO_ICON: Record<Scenario, LucideIcon> = {
  lake: Fish,
  field: Flower2,
  forest: TreePine,
};

export function ScenarioPicker({
  value,
  disabled,
  onChange,
}: {
  value: Scenario;
  disabled?: boolean;
  onChange: (scenario: Scenario) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {Object.entries(SCENARIOS).map(([key, info]) => {
        const scenario = key as Scenario;
        const Icon = SCENARIO_ICON[scenario];
        const selected = value === scenario;
        return (
          <button
            key={scenario}
            type="button"
            disabled={disabled}
            onClick={() => onChange(scenario)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-md border p-3 text-left transition-colors",
              selected ? "border-primary bg-primary/5" : "border-border bg-background/60",
              !disabled && !selected && "hover:border-foreground/30",
              disabled && !selected && "opacity-50"
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="text-sm font-medium">
              {info.invasiveLabel} vs. {info.nativeLabel}
            </span>
            <span className="text-muted-foreground text-xs leading-snug">{info.description}</span>
          </button>
        );
      })}
    </div>
  );
}
