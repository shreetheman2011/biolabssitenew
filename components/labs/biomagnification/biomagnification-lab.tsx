"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { ArrowRight, FlaskConical, Pipette } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LedgerTag } from "@/components/ui/ledger-tag";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DoseCylinder, TransferSyringe } from "./dose-control";
import { OrganismCard } from "./organism-card";
import { ShelfRack } from "./shelf-rack";
import { SpecimenJar } from "./specimen-jar";
import {
  DEFAULT_PRODUCER_CONCENTRATION,
  DEFAULT_RATIOS,
  ORGANISMS,
  TROPHIC_LEVELS,
  TROPHIC_LEVEL_LABELS,
  computeChainConcentrations,
  type TrophicLevel,
} from "./data";
import type { LabComponentProps } from "@/lib/labs/types";

type BiomagnificationSimState = {
  chain: Record<TrophicLevel, string | null>;
  producerConcentration: number;
  ratios: [number, number, number];
};

function defaultChain(): Record<TrophicLevel, string | null> {
  return { producer: null, primary: null, secondary: null, tertiary: null };
}

const RATIO_LABELS = ["Producer to primary", "Primary to secondary", "Secondary to tertiary"];
const RATIO_DESCRIPTIONS = [
  "How many times more concentrated the pollutant gets when a primary consumer eats a large volume of producers.",
  "How many times more concentrated the pollutant gets when a secondary consumer eats several primary consumers.",
  "How many times more concentrated the pollutant gets when a tertiary consumer eats several secondary consumers.",
];

export function BiomagnificationLab({ simState, onSimStateChange, readOnly, gradingView }: LabComponentProps) {
  const state = simState as Partial<BiomagnificationSimState>;
  const chain = state.chain ?? defaultChain();
  const producerConcentration = state.producerConcentration ?? DEFAULT_PRODUCER_CONCENTRATION;
  const ratios = state.ratios ?? DEFAULT_RATIOS;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function patch(next: Partial<BiomagnificationSimState>) {
    onSimStateChange?.({ chain, producerConcentration, ratios, ...next });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const organism = ORGANISMS.find((o) => o.id === active.id);
    if (!organism) return;
    const level = over.id as TrophicLevel;
    if (organism.level !== level) return;
    if (chain[level]) return;
    patch({ chain: { ...chain, [level]: organism.id } });
  }

  const placedIds = new Set(Object.values(chain).filter(Boolean));
  const pool = ORGANISMS.filter((o) => !placedIds.has(o.id));
  const chainComplete = TROPHIC_LEVELS.every((level) => chain[level]);

  const concentrations = chainComplete ? computeChainConcentrations(producerConcentration, ratios) : null;
  const chartData = concentrations
    ? TROPHIC_LEVELS.map((level, i) => ({
        level: TROPHIC_LEVEL_LABELS[level],
        organism: ORGANISMS.find((o) => o.id === chain[level])?.label ?? "",
        concentration: Math.round(concentrations[i] * 100) / 100,
      }))
    : [];

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden border-foreground/15 bg-[linear-gradient(180deg,var(--muted)_0%,var(--background)_60%)] py-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <LedgerTag>Bench 4</LedgerTag>
            <span className="text-muted-foreground font-mono text-xs">
              {!chainComplete ? "Assembling food chain" : "Specimens dosed and shelved"}
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <FlaskConical className="size-3.5" />
            specimen shelf
          </span>
        </div>

        <CardContent className="px-5 py-5">
          <div className="mb-4 flex flex-col gap-1.5">
            <p className="text-sm">
              A pollutant that the body can&apos;t break down or flush out, like many pesticides and heavy metals,
              enters this food chain at the producer level in a low dose. Nothing new is ever added after that first
              jar. But every animal that eats a dosed organism keeps that dose, and every predator that eats several
              of those animals inherits all of their stored doses at once. That is why the concentration climbs at
              every step up the chain.
            </p>
            <p className="text-muted-foreground text-sm">
              Drag each organism onto the jar for its trophic level below, from producer up to a top predator.
            </p>
          </div>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex items-end justify-around gap-1 overflow-x-auto pb-1">
              {TROPHIC_LEVELS.map((level, i) => (
                <div key={level} className="flex items-end gap-1">
                  <SpecimenJar
                    level={level}
                    organism={ORGANISMS.find((o) => o.id === chain[level]) ?? null}
                    concentration={concentrations ? concentrations[i] : null}
                    readOnly={readOnly}
                    onRemove={() => patch({ chain: { ...chain, [level]: null } })}
                  />
                  {i < TROPHIC_LEVELS.length - 1 && (
                    <ArrowRight className="text-muted-foreground mb-10 size-4 shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <ShelfRack />
            {pool.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                <p className="text-muted-foreground text-xs font-medium">Available specimens</p>
                <div className="flex flex-wrap gap-2">
                  {pool.map((organism) => (
                    <OrganismCard key={organism.id} organism={organism} disabled={readOnly} />
                  ))}
                </div>
              </div>
            )}
          </DndContext>
        </CardContent>
      </Card>

      {chainComplete && concentrations && (
        <Card className="gap-4 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="flex items-center gap-1.5 text-base">
              <Pipette className="size-4" />
              Dosing station
            </CardTitle>
            <CardDescription>
              Draw up the starting dose at the producer level, then set how much the pollutant concentrates at each
              transfer up the chain. The concentration never gets diluted back down, it only ever multiplies.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-5 pb-5">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <DoseCylinder
                label="Producer dose"
                description="The pollutant concentration present in the producer organisms when the chain starts, in parts per million."
                value={producerConcentration}
                min={0.1}
                max={5}
                step={0.1}
                disabled={readOnly}
                onChange={(v) => patch({ producerConcentration: v })}
              />
              <div className="flex flex-1 flex-col gap-5">
                {ratios.map((ratio, i) => (
                  <TransferSyringe
                    key={i}
                    label={RATIO_LABELS[i]}
                    description={RATIO_DESCRIPTIONS[i]}
                    value={ratio}
                    min={1}
                    max={10}
                    step={0.5}
                    disabled={readOnly}
                    onChange={(v) => {
                      const next = [...ratios] as [number, number, number];
                      next[i] = v;
                      patch({ ratios: next });
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 font-mono text-xs">
              <span className="text-muted-foreground">the math:</span>
              {concentrations.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-foreground">
                    {c.toFixed(2)} ppm
                  </span>
                  {i < ratios.length && <span className="text-muted-foreground">x {ratios[i].toFixed(1)}</span>}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {chainComplete && concentrations && (
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Concentration up the chain</CardTitle>
            <CardDescription>
              Each bar is the jar to its left multiplied by the transfer ratio you set above. Hover a bar to read its
              exact value.
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-grid-faint px-5 pb-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="concentration" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {chainComplete && gradingView && chartData.length > 0 && (
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Exact readings</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trophic level</TableHead>
                  <TableHead>Organism</TableHead>
                  <TableHead className="text-right">Concentration (ppm)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((row) => (
                  <TableRow key={row.level}>
                    <TableCell>{row.level}</TableCell>
                    <TableCell>{row.organism}</TableCell>
                    <TableCell className="text-right">{row.concentration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
