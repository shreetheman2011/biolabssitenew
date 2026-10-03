"use client";

import { useRef } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const VB_W = 120;
const VB_H = 90;
const CX = 60;
const CY = 78;
const R = 54;
const PIVOT_X_FRAC = CX / VB_W;
const PIVOT_Y_FRAC = CY / VB_H;

function pointOnArc(fraction: number, radius: number) {
  const angleDeg = 180 - fraction * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(angleRad),
    y: CY - radius * Math.sin(angleRad),
  };
}

export function GaugeDial({
  label,
  description,
  value,
  min,
  max,
  step,
  unit,
  disabled,
  formatValue,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));

  function valueFromPointer(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const pivotX = rect.left + rect.width * PIVOT_X_FRAC;
    const pivotY = rect.top + rect.height * PIVOT_Y_FRAC;
    const dx = clientX - pivotX;
    const dy = clientY - pivotY;
    const angleDeg = (Math.atan2(-dy, dx) * 180) / Math.PI;
    const clampedAngle = Math.min(180, Math.max(0, angleDeg));
    const frac = (180 - clampedAngle) / 180;
    const raw = min + frac * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, snapped));
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(valueFromPointer(e.clientX, e.clientY));
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled || e.buttons === 0) return;
    onChange(valueFromPointer(e.clientX, e.clientY));
  }

  function handleKeyDown(e: React.KeyboardEvent<SVGSVGElement>) {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(max, value + step));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(min, value - step));
    }
  }

  const needleTip = pointOnArc(fraction, R - 10);
  const progressEnd = pointOnArc(fraction, R);
  const display = formatValue ? formatValue(value) : String(value);

  return (
    <div className={cn("flex flex-col items-center gap-1.5", disabled && "opacity-50")}>
      <svg
        ref={ref}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className={cn("h-auto w-28 touch-none select-none", !disabled && "cursor-pointer")}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
      >
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${progressEnd.x} ${progressEnd.y}`}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={7}
          strokeLinecap="round"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const inner = pointOnArc(f, R - 9);
          const outer = pointOnArc(f, R + 2);
          return (
            <line
              key={f}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              opacity={0.5}
            />
          );
        })}
        <circle cx={CX} cy={CY} r={4} fill="var(--foreground)" />
        <line
          x1={CX}
          y1={CY}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: "x2 120ms ease-out, y2 120ms ease-out" }}
        />
        <text x={CX} y={CY - 18} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill="var(--foreground)">
          {display}
          {unit ?? ""}
        </text>
      </svg>
      <span className="flex items-center gap-1">
        <span className="text-center text-xs leading-tight font-medium">{label}</span>
        {description && (
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`What ${label.toLowerCase()} does`}
            >
              <Info className="size-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-center">{description}</TooltipContent>
          </Tooltip>
        )}
      </span>
    </div>
  );
}
