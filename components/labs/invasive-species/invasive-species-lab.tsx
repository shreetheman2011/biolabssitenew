"use client";

import { useEffect, useRef } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pause, Play, RotateCcw, SquareStop } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_MODIFIERS,
  DEFAULT_PARAMS,
  MANAGEMENT_STRATEGIES,
  MAX_YEARS,
  NATIVE_START,
  SCENARIOS,
  shannonIndex,
  stepYear,
  type ManagementStrategyId,
  type Modifiers,
  type Scenario,
  type SimParams,
  type YearPoint,
} from "./data";
import type { LabComponentProps } from "@/lib/labs/types";

type SimStatus = "configuring" | "running" | "paused" | "complete";

type InvasiveSimState = {
  scenario: Scenario;
  params: SimParams;
  history: YearPoint[];
  appliedStrategies: ManagementStrategyId[];
  events: { year: number; strategy: ManagementStrategyId }[];
  modifiers: Modifiers;
  status: SimStatus;
};

export function InvasiveSpeciesLab({ simState, onSimStateChange, readOnly }: LabComponentProps) {
  const state = simState as Partial<InvasiveSimState>;
  const scenario = state.scenario ?? "lake";
  const params = state.params ?? DEFAULT_PARAMS;
  const history = state.history ?? [];
  const appliedStrategies = state.appliedStrategies ?? [];
  const events = state.events ?? [];
  const modifiers = state.modifiers ?? DEFAULT_MODIFIERS;
  const status: SimStatus = state.status ?? "configuring";

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function patch(next: Partial<InvasiveSimState>) {
    onSimStateChange({ scenario, params, history, appliedStrategies, events, modifiers, status, ...next });
  }

  useEffect(() => {
    if (status !== "running" || readOnly) return;
    tickRef.current = setInterval(() => {
      const last = history[history.length - 1];
      if (!last || last.year >= MAX_YEARS) {
        patch({ status: "complete" });
        return;
      }
      const next = stepYear(last.native, last.invasive, params, modifiers);
      const point: YearPoint = { year: last.year + 1, native: next.native, invasive: next.invasive };
      const nextHistory = [...history, point];
      if (point.year >= MAX_YEARS) {
        patch({ history: nextHistory, status: "complete" });
      } else {
        patch({ history: nextHistory });
      }
    }, 450);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, JSON.stringify(history), JSON.stringify(params), JSON.stringify(modifiers), readOnly]);

  function startSimulation() {
    const first: YearPoint = { year: 0, native: NATIVE_START, invasive: params.initialInvasive };
    patch({ history: [first], status: "running", appliedStrategies: [], events: [], modifiers: DEFAULT_MODIFIERS });
  }

  function applyStrategy(id: ManagementStrategyId) {
    const last = history[history.length - 1];
    if (!last) return;
    const event = { year: last.year, strategy: id };
    if (id === "biological_control") {
      patch({
        modifiers: { ...modifiers, growthMultiplier: modifiers.growthMultiplier * 0.5 },
        appliedStrategies: [...appliedStrategies, id],
        events: [...events, event],
      });
    } else if (id === "barrier") {
      patch({
        modifiers: { ...modifiers, capMultiplier: modifiers.capMultiplier * 0.6 },
        appliedStrategies: [...appliedStrategies, id],
        events: [...events, event],
      });
    } else {
      const reduced = Math.round(last.invasive * 0.6);
      patch({
        history: [...history.slice(0, -1), { ...last, invasive: reduced }],
        appliedStrategies: [...appliedStrategies, id],
        events: [...events, event],
      });
    }
  }

  const started = history.length > 0;
  const first = history[0];
  const last = history[history.length - 1];
  const nativeDeclinePct = first && last && first.native > 0 ? Math.round((1 - last.native / first.native) * 100) : null;
  const diversityStart = first ? shannonIndex(first.native, first.invasive) : null;
  const diversityEnd = last ? shannonIndex(last.native, last.invasive) : null;
  const diversityChangePct =
    diversityStart !== null && diversityEnd !== null && diversityStart > 0
      ? Math.round((1 - diversityEnd / diversityStart) * 100)
      : null;

  const labels = SCENARIOS[scenario];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Set up your ecosystem</CardTitle>
          <CardDescription>{labels.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pb-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Scenario</Label>
              <Select
                value={scenario}
                disabled={started || readOnly}
                onValueChange={(value) => patch({ scenario: value as Scenario })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCENARIOS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.invasiveLabel} vs. {info.nativeLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <ParamSlider
              label="Initial invasive population"
              value={params.initialInvasive}
              min={5}
              max={100}
              step={5}
              disabled={started || readOnly}
              onChange={(v) => patch({ params: { ...params, initialInvasive: v } })}
            />
            <ParamSlider
              label="Invasive growth rate"
              value={params.invasiveGrowthRate}
              min={0.05}
              max={0.6}
              step={0.05}
              disabled={started || readOnly}
              onChange={(v) => patch({ params: { ...params, invasiveGrowthRate: v } })}
            />
            <ParamSlider
              label="Predation pressure on invasive"
              value={params.predationPressure}
              min={0}
              max={0.8}
              step={0.05}
              disabled={started || readOnly}
              onChange={(v) => patch({ params: { ...params, predationPressure: v } })}
            />
            <ParamSlider
              label="Shared resource cap"
              value={params.resourceCap}
              min={200}
              max={1000}
              step={50}
              disabled={started || readOnly}
              onChange={(v) => patch({ params: { ...params, resourceCap: v } })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!started && (
              <Button onClick={startSimulation} disabled={readOnly}>
                <Play />
                Start simulation
              </Button>
            )}
            {started && status === "running" && (
              <Button variant="outline" onClick={() => patch({ status: "paused" })}>
                <Pause />
                Pause
              </Button>
            )}
            {started && status === "paused" && (
              <Button variant="outline" onClick={() => patch({ status: "running" })}>
                <Play />
                Resume
              </Button>
            )}
            {started && status !== "complete" && (
              <Button variant="outline" onClick={() => patch({ status: "complete" })}>
                <SquareStop />
                End simulation now
              </Button>
            )}
            {started && (
              <Button
                variant="ghost"
                disabled={readOnly}
                onClick={() =>
                  patch({
                    history: [],
                    status: "configuring",
                    appliedStrategies: [],
                    events: [],
                    modifiers: DEFAULT_MODIFIERS,
                  })
                }
              >
                <RotateCcw />
                Restart with new parameters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {started && (
        <Card>
          <CardHeader>
            <CardTitle>Population over time</CardTitle>
            <CardDescription>
              Year {last?.year ?? 0} of {MAX_YEARS}
              {status === "running" && ", running"}
              {status === "complete" && ", simulation complete"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {events.map((e, i) => (
                    <ReferenceLine
                      key={i}
                      x={e.year}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      label={{ value: MANAGEMENT_STRATEGIES[e.strategy].label, fontSize: 10, position: "top" }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="native"
                    name={labels.nativeLabel}
                    stroke="var(--color-chart-5)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="invasive"
                    name={labels.invasiveLabel}
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm font-medium">Management strategies</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(MANAGEMENT_STRATEGIES).map(([id, info]) => (
                  <Button
                    key={id}
                    variant="outline"
                    size="sm"
                    disabled={readOnly || status === "complete" || status === "configuring" || appliedStrategies.includes(id as ManagementStrategyId)}
                    onClick={() => applyStrategy(id as ManagementStrategyId)}
                    title={info.description}
                  >
                    {info.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "complete" && diversityChangePct !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Biodiversity impact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-6 text-sm">
            <p>
              Native population changed from {first?.native} to {last?.native} ({nativeDeclinePct}% decline).
            </p>
            <p>
              The two-species diversity index dropped {diversityChangePct}% from start ({diversityStart?.toFixed(2)}) to
              finish ({diversityEnd?.toFixed(2)}). A lower index means the ecosystem is more dominated by a single species.
            </p>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Year-by-year log</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto pb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>{labels.nativeLabel}</TableHead>
                  <TableHead>{labels.invasiveLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((point) => (
                  <TableRow key={point.year}>
                    <TableCell>{point.year}</TableCell>
                    <TableCell>{point.native}</TableCell>
                    <TableCell>{point.invasive}</TableCell>
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

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground text-xs">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
