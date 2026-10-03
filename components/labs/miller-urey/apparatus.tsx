"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ApparatusPhase = "idle" | "circulating" | "sparking" | "condensing" | "result";

export function Apparatus({
  phase,
  heat,
  sparkEnabled,
  hasCompounds,
}: {
  phase: ApparatusPhase;
  heat: boolean;
  sparkEnabled: boolean;
  hasCompounds: boolean | null;
}) {
  const bubbling = phase === "circulating" && heat;
  const sparking = phase === "sparking" && sparkEnabled;
  const condensing = phase === "condensing";
  const showResult = phase === "result";

  return (
    <svg viewBox="0 0 420 300" className="h-auto w-full max-w-xl mx-auto" aria-hidden>
      <path
        d="M 80 190 L 80 90 L 220 90"
        fill="none"
        stroke="var(--border)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M 254 92 C 300 100, 310 150, 320 190"
        fill="none"
        stroke="var(--border)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={270 + i * 12}
          y1={100 + i * 14}
          x2={282 + i * 12}
          y2={92 + i * 14}
          stroke="var(--muted-foreground)"
          strokeWidth={2}
          opacity={0.5}
        />
      ))}
      <text x="296" y="80" fontSize="10" fill="var(--muted-foreground)">
        condenser
      </text>

      <ellipse cx="80" cy="225" rx="58" ry="38" fill="none" stroke="var(--foreground)" strokeWidth={3} />
      <motion.path
        d="M 24 230 Q 80 215, 136 230 L 136 262 Q 80 263, 24 262 Z"
        fill="var(--color-chart-2)"
        opacity={0.35}
        animate={heat ? { d: ["M 24 230 Q 80 215, 136 230 L 136 262 Q 80 263, 24 262 Z", "M 24 226 Q 80 220, 136 226 L 136 262 Q 80 263, 24 262 Z", "M 24 230 Q 80 215, 136 230 L 136 262 Q 80 263, 24 262 Z"] } : {}}
        transition={{ duration: 1.4, repeat: heat ? Infinity : 0 }}
      />
      <text x="52" y="282" fontSize="11" fill="var(--muted-foreground)">
        boiling flask
      </text>

      <AnimatePresence>
        {bubbling &&
          [0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={i}
              cx={56 + i * 14}
              r={3}
              fill="var(--background)"
              initial={{ cy: 258, opacity: 0 }}
              animate={{ cy: 210, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
      </AnimatePresence>

      <path
        d="M 50 275 L 60 285 L 70 275 L 80 285 L 90 275 L 100 285 L 110 275"
        fill="none"
        stroke={heat ? "var(--color-chart-5)" : "var(--border)"}
        strokeWidth={3}
        strokeLinecap="round"
        className={cn(heat && "transition-colors")}
      />

      <circle
        cx="220"
        cy="90"
        r="42"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={3}
      />
      <text x="186" y="48" fontSize="10" fill="var(--muted-foreground)">
        spark chamber
      </text>
      <line x1="220" y1="68" x2="220" y2="82" stroke="var(--foreground)" strokeWidth={3} />
      <line x1="220" y1="98" x2="220" y2="112" stroke="var(--foreground)" strokeWidth={3} />

      <AnimatePresence>
        {sparking && (
          <motion.path
            d="M 220 82 L 213 90 L 224 92 L 215 100 L 220 112"
            fill="none"
            stroke="var(--color-chart-5)"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.6, 1] }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {condensing && (
          <motion.circle
            r={4}
            fill="var(--color-chart-2)"
            initial={{ cx: 254, cy: 100, opacity: 1 }}
            animate={{ cx: [254, 300, 318, 320], cy: [100, 150, 190, 215] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      <ellipse
        cx="330"
        cy="240"
        rx="48"
        ry="32"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={3}
      />
      <motion.ellipse
        cx="330"
        cy="252"
        rx="40"
        ry="14"
        animate={{
          fill:
            showResult && hasCompounds
              ? "var(--color-success)"
              : showResult && hasCompounds === false
                ? "var(--muted)"
                : "var(--muted)",
          opacity: showResult ? 0.45 : 0.2,
        }}
      />
      <text x="300" y="285" fontSize="11" fill="var(--muted-foreground)">
        collection trap
      </text>
    </svg>
  );
}
