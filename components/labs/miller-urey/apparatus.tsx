"use client";

import { AnimatePresence, motion } from "framer-motion";
import { COMPOUND_INFO } from "./chemistry";

export type ApparatusPhase = "idle" | "circulating" | "sparking" | "condensing" | "result";

const GLASS_STROKE = "var(--foreground)";

function GlassVessel({ d, highlightD }: { d: string; highlightD: string }) {
  return (
    <>
      <path d={d} fill="url(#glassFill)" stroke={GLASS_STROKE} strokeWidth={2.5} />
      <path d={highlightD} fill="none" stroke="white" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

export function Apparatus({
  phase,
  heat,
  sparkEnabled,
  hasCompounds,
  compounds,
}: {
  phase: ApparatusPhase;
  heat: boolean;
  sparkEnabled: boolean;
  hasCompounds: boolean | null;
  compounds?: string[];
}) {
  const bubbling = phase === "circulating" && heat;
  const sparking = phase === "sparking" && sparkEnabled;
  const condensing = phase === "condensing";
  const showResult = phase === "result";
  const aminoAcids = (compounds ?? []).filter((c) => COMPOUND_INFO[c]?.kind === "amino-acid");

  return (
    <svg viewBox="0 0 520 360" className="h-auto w-full max-w-2xl mx-auto" aria-hidden>
      <defs>
        <radialGradient id="glassFill" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor="var(--card)" stopOpacity={0.9} />
          <stop offset="70%" stopColor="var(--muted)" stopOpacity={0.5} />
          <stop offset="100%" stopColor="var(--border)" stopOpacity={0.35} />
        </radialGradient>
        <linearGradient id="flameGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-chart-2)" />
          <stop offset="55%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0.7} />
        </linearGradient>
        <filter id="sparkGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ring stand */}
      <rect x="36" y="40" width="6" height="280" fill="var(--muted-foreground)" opacity={0.5} />
      <rect x="18" y="312" width="80" height="8" rx="2" fill="var(--muted-foreground)" opacity={0.6} />
      <ellipse cx="128" cy="236" rx="46" ry="7" fill="none" stroke="var(--muted-foreground)" strokeWidth={3} opacity={0.6} />
      <path d="M 42 236 L 84 236" stroke="var(--muted-foreground)" strokeWidth={3} opacity={0.6} />

      {/* bunsen burner */}
      <rect x="104" y="296" width="48" height="10" rx="2" fill="var(--foreground)" opacity={0.8} />
      <rect x="120" y="266" width="16" height="32" fill="var(--muted-foreground)" />
      <AnimatePresence>
        {heat && (
          <motion.path
            d="M 128 266 C 120 250, 136 244, 128 230 C 140 240, 142 254, 132 266 Z"
            fill="url(#flameGradient)"
            initial={{ opacity: 0, scaleY: 0.6 }}
            animate={{ opacity: [0.8, 1, 0.8], scaleY: [0.9, 1.08, 0.9] }}
            exit={{ opacity: 0 }}
            style={{ transformOrigin: "128px 266px" }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>
      <text x="20" y="330" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
        burner
      </text>

      {/* boiling flask */}
      <GlassVessel
        d="M 104 236 L 104 190 C 104 180, 112 176, 128 176 C 144 176, 152 180, 152 190 L 152 236 C 152 258, 178 264, 178 280 C 178 300, 152 306, 128 306 C 104 306, 78 300, 78 280 C 78 264, 104 258, 104 236 Z"
        highlightD="M 96 260 C 96 275, 108 286, 118 290"
      />
      <motion.path
        d="M 86 272 Q 128 258, 170 272 L 170 294 Q 128 300, 86 294 Z"
        fill="var(--color-chart-2)"
        opacity={0.4}
        animate={
          heat
            ? {
                d: [
                  "M 86 272 Q 128 258, 170 272 L 170 294 Q 128 300, 86 294 Z",
                  "M 86 266 Q 128 274, 170 266 L 170 294 Q 128 300, 86 294 Z",
                  "M 86 272 Q 128 258, 170 272 L 170 294 Q 128 300, 86 294 Z",
                ],
              }
            : {}
        }
        transition={{ duration: 1.4, repeat: heat ? Infinity : 0 }}
      />
      <AnimatePresence>
        {bubbling &&
          [0, 1, 2, 3, 4].map((i) => (
            <motion.circle
              key={i}
              cx={100 + i * 16}
              r={2.6}
              fill="var(--background)"
              initial={{ cy: 290, opacity: 0 }}
              animate={{ cy: 240, opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
      </AnimatePresence>
      <text x="90" y="328" fontSize="11" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
        H2O reservoir
      </text>

      {/* tube from flask to spark chamber */}
      <path
        d="M 152 196 C 220 196, 240 150, 300 120"
        fill="none"
        stroke="var(--border)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M 152 196 C 220 196, 240 150, 300 120"
        fill="none"
        stroke={GLASS_STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* spark chamber */}
      <circle cx="330" cy="96" r="54" fill="url(#glassFill)" stroke={GLASS_STROKE} strokeWidth={2.5} />
      <text x="282" y="32" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
        spark chamber
      </text>
      <line x1="330" y1="46" x2="330" y2="76" stroke="var(--foreground)" strokeWidth={4} strokeLinecap="round" />
      <line x1="330" y1="116" x2="330" y2="146" stroke="var(--foreground)" strokeWidth={4} strokeLinecap="round" />
      <circle cx="330" cy="76" r="3.5" fill="var(--foreground)" />
      <circle cx="330" cy="116" r="3.5" fill="var(--foreground)" />
      <AnimatePresence>
        {sparking && (
          <motion.path
            filter="url(#sparkGlow)"
            d="M 330 76 L 320 90 L 336 94 L 322 110 L 330 116"
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.6, 1] }}
          />
        )}
      </AnimatePresence>

      {/* condenser coil */}
      <path
        d="M 330 150 C 330 170, 352 172, 352 188 C 352 204, 330 206, 330 222 C 330 238, 352 240, 352 256"
        fill="none"
        stroke="var(--border)"
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path
        d="M 330 150 C 330 170, 352 172, 352 188 C 352 204, 330 206, 330 222 C 330 238, 352 240, 352 256"
        fill="none"
        stroke={GLASS_STROKE}
        strokeWidth={1.2}
        opacity={0.5}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={366}
          y1={158 + i * 22}
          x2={378}
          y2={150 + i * 22}
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          opacity={0.45}
        />
      ))}
      <text x="384" y="200" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
        condenser
      </text>

      <AnimatePresence>
        {condensing && (
          <motion.circle
            r={4}
            fill="var(--color-chart-2)"
            initial={{ cx: 352, cy: 256, opacity: 1 }}
            animate={{ cx: [352, 380, 404, 414], cy: [256, 290, 310, 322] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      {/* collection tube, graduated cylinder */}
      <path
        d="M 390 230 L 390 322 C 390 334, 400 340, 418 340 C 436 340, 446 334, 446 322 L 446 230"
        fill="url(#glassFill)"
        stroke={GLASS_STROKE}
        strokeWidth={2.5}
      />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={390} y1={246 + i * 22} x2={398} y2={246 + i * 22} stroke="var(--muted-foreground)" strokeWidth={1.5} opacity={0.6} />
      ))}
      <motion.path
        d="M 392 320 C 392 330, 402 336, 418 336 C 434 336, 444 330, 444 320 L 444 300 L 392 300 Z"
        animate={{
          fill:
            showResult && hasCompounds
              ? "var(--color-success)"
              : "var(--color-chart-2)",
          opacity: showResult ? 0.55 : condensing ? 0.3 : 0.2,
          d:
            showResult || condensing
              ? "M 392 320 C 392 330, 402 336, 418 336 C 434 336, 444 330, 444 320 L 444 276 L 392 276 Z"
              : "M 392 320 C 392 330, 402 336, 418 336 C 434 336, 444 330, 444 320 L 444 300 L 392 300 Z",
        }}
        transition={{ duration: 0.8 }}
      />
      <AnimatePresence>
        {showResult &&
          aminoAcids.map((c, i) => (
            <motion.g
              key={c}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
            >
              <g transform={`translate(${404 + (i % 2) * 20}, ${312 - Math.floor(i / 2) * 14})`}>
                <line x1="0" y1="0" x2="6" y2="-5" stroke="var(--foreground)" strokeWidth={1} opacity={0.7} />
                <circle r="2.6" fill="var(--success)" />
                <circle cx="6" cy="-5" r="2" fill="var(--color-chart-1)" />
              </g>
            </motion.g>
          ))}
      </AnimatePresence>
      <text x="394" y="356" fontSize="10" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">
        collection trap
      </text>
    </svg>
  );
}
