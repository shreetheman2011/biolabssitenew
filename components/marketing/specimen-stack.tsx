"use client";

import { motion } from "framer-motion";
import { FlaskConical, Dna, Bug, Fish, type LucideIcon } from "lucide-react";

type Specimen = {
  code: string;
  icon: LucideIcon;
  title: string;
};

const SPECIMENS: Specimen[] = [
  { code: "MU-01", icon: FlaskConical, title: "Miller-Urey" },
  { code: "ES-02", icon: Dna, title: "Endosymbiosis" },
  { code: "IS-03", icon: Bug, title: "Invasive species" },
  { code: "BM-04", icon: Fish, title: "Biomagnification" },
];

const RESTING = [
  { x: 28, y: 0, rotate: -4 },
  { x: 46, y: 38, rotate: 2.5 },
  { x: 14, y: 76, rotate: -2 },
  { x: 50, y: 116, rotate: 3.5 },
];

export function SpecimenStack() {
  return (
    <div className="relative h-[270px] w-full max-w-[300px] shrink-0">
      {SPECIMENS.map((specimen, i) => (
        <motion.div
          key={specimen.code}
          initial={{ x: 20, y: 0, rotate: 0, opacity: 0 }}
          animate={{
            x: RESTING[i].x,
            y: RESTING[i].y,
            rotate: RESTING[i].rotate,
            opacity: 1,
          }}
          transition={{
            delay: 0.2 + i * 0.1,
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute left-0 top-0 flex w-52 items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
          style={{ zIndex: i }}
        >
          <specimen.icon className="text-primary size-5 shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="font-mono text-[0.65rem] tracking-wide text-muted-foreground">
              {specimen.code}
            </p>
            <p className="truncate text-sm font-medium">{specimen.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
