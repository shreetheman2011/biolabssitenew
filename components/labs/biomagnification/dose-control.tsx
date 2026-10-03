"use client";

import { useId, useRef } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const CYL_VB_W = 64;
const CYL_VB_H = 176;
const TUBE_X = 18;
const TUBE_W = 28;
const TUBE_TOP = 20;
const TUBE_BOTTOM = 158;

export function DoseCylinder({
  label,
  description,
  value,
  min,
  max,
  step,
  unit = "ppm",
  disabled,
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
  onChange: (value: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const liquidY = TUBE_BOTTOM - fraction * (TUBE_BOTTOM - TUBE_TOP);
  const tintPct = 20 + fraction * 65;

  function valueFromPointer(clientY: number) {
    const el = ref.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const top = rect.top + (TUBE_TOP / CYL_VB_H) * rect.height;
    const bottom = rect.top + (TUBE_BOTTOM / CYL_VB_H) * rect.height;
    const clamped = Math.min(bottom, Math.max(top, clientY));
    const frac = 1 - (clamped - top) / (bottom - top);
    const raw = min + frac * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, snapped));
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(valueFromPointer(e.clientY));
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled || e.buttons === 0) return;
    onChange(valueFromPointer(e.clientY));
  }

  function handleKeyDown(e: React.KeyboardEvent<SVGSVGElement>) {
    if (disabled) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(Math.min(max, Math.round((value + step) * 10) / 10));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(Math.max(min, Math.round((value - step) * 10) / 10));
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-1.5", disabled && "opacity-50")}>
      <svg
        ref={ref}
        viewBox={`0 0 ${CYL_VB_W} ${CYL_VB_H}`}
        className={cn("h-44 w-auto touch-none select-none", !disabled && "cursor-pointer")}
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
        <clipPath id={clipId}>
          <rect x={TUBE_X} y={TUBE_TOP} width={TUBE_W} height={TUBE_BOTTOM - TUBE_TOP} rx={3} />
        </clipPath>
        <rect
          x={TUBE_X}
          y={TUBE_TOP}
          width={TUBE_W}
          height={TUBE_BOTTOM - TUBE_TOP}
          rx={3}
          fill="color-mix(in oklch, var(--background) 85%, var(--foreground) 4%)"
          stroke="var(--border)"
          strokeWidth={1.5}
        />
        <rect x={TUBE_X - 5} y={TUBE_BOTTOM} width={TUBE_W + 10} height={9} rx={2} fill="var(--border)" />
        {Array.from({ length: 6 }).map((_, i) => {
          const y = TUBE_TOP + (i / 5) * (TUBE_BOTTOM - TUBE_TOP);
          return (
            <line
              key={i}
              x1={TUBE_X}
              y1={y}
              x2={TUBE_X + 7}
              y2={y}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}
        <rect
          x={TUBE_X}
          y={liquidY}
          width={TUBE_W}
          height={TUBE_BOTTOM - liquidY}
          clipPath={`url(#${clipId})`}
          fill={`color-mix(in oklch, var(--chart-3) ${tintPct}%, var(--background))`}
          style={{ transition: "y 150ms ease-out, height 150ms ease-out" }}
        />
        <ellipse
          cx={TUBE_X + TUBE_W / 2}
          cy={liquidY}
          rx={TUBE_W / 2}
          ry={2.2}
          fill={`color-mix(in oklch, var(--chart-3) ${tintPct + 12}%, var(--background))`}
          style={{ transition: "cy 150ms ease-out" }}
        />
        <text
          x={TUBE_X + TUBE_W / 2}
          y={TUBE_TOP - 7}
          textAnchor="middle"
          fontSize="12"
          fontFamily="var(--font-mono)"
          fill="var(--foreground)"
        >
          {value.toFixed(1)} {unit}
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
            <TooltipContent className="max-w-60 text-center">{description}</TooltipContent>
          </Tooltip>
        )}
      </span>
    </div>
  );
}

const SYR_VB_W = 190;
const SYR_VB_H = 60;
const BARREL_X = 16;
const BARREL_W = 122;
const BARREL_Y = 18;
const BARREL_H = 20;

export function TransferSyringe({
  label,
  description,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const clipId = useId();
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const plungerX = BARREL_X + fraction * BARREL_W;
  const tintPct = 25 + fraction * 60;

  function valueFromPointer(clientX: number) {
    const el = ref.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const left = rect.left + (BARREL_X / SYR_VB_W) * rect.width;
    const right = rect.left + ((BARREL_X + BARREL_W) / SYR_VB_W) * rect.width;
    const clamped = Math.min(right, Math.max(left, clientX));
    const frac = (clamped - left) / (right - left);
    const raw = min + frac * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, snapped));
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(valueFromPointer(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled || e.buttons === 0) return;
    onChange(valueFromPointer(e.clientX));
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

  return (
    <div className={cn("flex flex-col gap-1.5", disabled && "opacity-50")}>
      <svg
        ref={ref}
        viewBox={`0 0 ${SYR_VB_W} ${SYR_VB_H}`}
        className={cn("h-14 w-full touch-none select-none", !disabled && "cursor-pointer")}
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
        <clipPath id={clipId}>
          <rect x={BARREL_X} y={BARREL_Y} width={BARREL_W} height={BARREL_H} rx={3} />
        </clipPath>
        <rect x={2} y={BARREL_Y - 5} width={7} height={BARREL_H + 10} rx={1.5} fill="var(--border)" />
        <rect
          x={BARREL_X}
          y={BARREL_Y}
          width={BARREL_W}
          height={BARREL_H}
          rx={3}
          fill="color-mix(in oklch, var(--background) 85%, var(--foreground) 4%)"
          stroke="var(--border)"
          strokeWidth={1.5}
        />
        {Array.from({ length: 6 }).map((_, i) => {
          const x = BARREL_X + (i / 5) * BARREL_W;
          return (
            <line
              key={i}
              x1={x}
              y1={BARREL_Y}
              x2={x}
              y2={BARREL_Y + 5}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}
        <line
          x1={BARREL_X + BARREL_W}
          y1={BARREL_Y + BARREL_H / 2}
          x2={SYR_VB_W - 8}
          y2={BARREL_Y + BARREL_H / 2}
          stroke="var(--muted-foreground)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <rect
          x={BARREL_X}
          y={BARREL_Y}
          width={fraction * BARREL_W}
          height={BARREL_H}
          clipPath={`url(#${clipId})`}
          fill={`color-mix(in oklch, var(--chart-3) ${tintPct}%, var(--background))`}
          style={{ transition: "width 150ms ease-out" }}
        />
        <line
          x1={plungerX}
          y1={BARREL_Y - 4}
          x2={plungerX}
          y2={BARREL_Y + BARREL_H + 4}
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: "x1 150ms ease-out, x2 150ms ease-out" }}
        />
        <text
          x={plungerX}
          y={BARREL_Y - 8}
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--foreground)"
        >
          {value.toFixed(1)}x
        </text>
      </svg>
      <span className="flex items-center gap-1">
        <span className="text-xs leading-tight font-medium">{label}</span>
        {description && (
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`What ${label.toLowerCase()} does`}
            >
              <Info className="size-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-center">{description}</TooltipContent>
          </Tooltip>
        )}
      </span>
    </div>
  );
}
