"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FoodChainSlot } from "./food-chain-slot";
import { OrganismCard } from "./organism-card";
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

const RATIO_LABELS = [
  "Producer → primary consumer",
  "Primary → secondary consumer",
  "Secondary → tertiary consumer",
];

export function BiomagnificationLab({ simState, onSimStateChange, readOnly }: LabComponentProps) {
  const state = simState as Partial<BiomagnificationSimState>;
  const chain = state.chain ?? defaultChain();
  const producerConcentration = state.producerConcentration ?? DEFAULT_PRODUCER_CONCENTRATION;
  const ratios = state.ratios ?? DEFAULT_RATIOS;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function patch(next: Partial<BiomagnificationSimState>) {
    onSimStateChange({ chain, producerConcentration, ratios, ...next });
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Build the food chain</CardTitle>
          <CardDescription>
            Drag each organism into the trophic level it belongs to, from producer up to a top predator.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-6">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex items-stretch gap-2 overflow-x-auto">
              {TROPHIC_LEVELS.map((level, i) => (
                <div key={level} className="flex items-center gap-2">
                  <FoodChainSlot
                    level={level}
                    organism={ORGANISMS.find((o) => o.id === chain[level]) ?? null}
                    concentration={concentrations ? concentrations[i] : null}
                    readOnly={readOnly}
                    onRemove={() => patch({ chain: { ...chain, [level]: null } })}
                  />
                  {i < TROPHIC_LEVELS.length - 1 && (
                    <ArrowRight className="text-muted-foreground size-5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
            {pool.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs font-medium">
                  Available organisms
                </p>
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

      {chainComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Set the pollutant math</CardTitle>
            <CardDescription>
              Choose how much pollutant starts at the producer level, and how much it multiplies at each step up
              the chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Pollutant concentration at producer level</Label>
                <span className="text-muted-foreground text-xs">{producerConcentration.toFixed(1)} ppm</span>
              </div>
              <Slider
                value={[producerConcentration]}
                min={0.1}
                max={5}
                step={0.1}
                disabled={readOnly}
                onValueChange={([v]) => patch({ producerConcentration: v })}
              />
            </div>
            {ratios.map((ratio, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>{RATIO_LABELS[i]} multiplier</Label>
                  <span className="text-muted-foreground text-xs">{ratio.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[ratio]}
                  min={1}
                  max={10}
                  step={0.5}
                  disabled={readOnly}
                  onValueChange={([v]) => {
                    const next = [...ratios] as [number, number, number];
                    next[i] = v;
                    patch({ ratios: next });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {chainComplete && concentrations && (
        <Card>
          <CardHeader>
            <CardTitle>Concentration up the chain</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
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
            <Table className="mt-4">
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
