"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
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
import { Fence, Pause, Play, RotateCcw, ShieldHalf, SquareStop, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LedgerTag } from "@/components/ui/ledger-tag";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FieldMap } from "./field-map";
import { GaugeDial } from "./gauge-dial";
import { ScenarioPicker } from "./scenario-picker";
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

const STRATEGY_ICON: Record<ManagementStrategyId, typeof ShieldHalf> = {
  biological_control: ShieldHalf,
  trapping: Target,
  barrier: Fence,
};

type SimStatus = "configuring" | "running" | "paused" | "complete";

const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;
const DEFAULT_SPEED = 0.5;
const BASE_TICK_MS = 1300;

type InvasiveSimState = {
  scenario: Scenario;
  params: SimParams;
  history: YearPoint[];
  appliedStrategies: ManagementStrategyId[];
  events: { year: number; strategy: ManagementStrategyId }[];
  modifiers: Modifiers;
  status: SimStatus;
  speed: number;
};

export function InvasiveSpeciesLab({ simState, onSimStateChange, readOnly, gradingView }: LabComponentProps) {
  const state = simState as Partial<InvasiveSimState>;
  const scenario = state.scenario ?? "lake";
  const params = state.params ?? DEFAULT_PARAMS;
  const history = state.history ?? [];
  const appliedStrategies = state.appliedStrategies ?? [];
  const events = state.events ?? [];
  const modifiers = state.modifiers ?? DEFAULT_MODIFIERS;
  const status: SimStatus = state.status ?? "configuring";
  const speed = state.speed ?? DEFAULT_SPEED;

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function patch(next: Partial<InvasiveSimState>) {
    onSimStateChange?.({ scenario, params, history, appliedStrategies, events, modifiers, status, speed, ...next });
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
    }, BASE_TICK_MS / speed);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, speed, JSON.stringify(history), JSON.stringify(params), JSON.stringify(modifiers), readOnly]);

  function startSimulation() {
    const first: YearPoint = { year: 0, native: NATIVE_START, invasive: params.initialInvasive };
    patch({
      history: [first],
      status: "running",
      appliedStrategies: [],
      events: [],
      modifiers: DEFAULT_MODIFIERS,
      speed: DEFAULT_SPEED,
    });
    toast("Keep your data table up to date", {
      description: "Fill in the journal table at regular intervals while you watch the populations change below.",
      duration: 7000,
    });
    document.getElementById("journal-prompt-data_table")?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  const running = status === "running";

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden border-foreground/15 bg-[linear-gradient(180deg,var(--muted)_0%,var(--background)_60%)] py-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <LedgerTag>Bench 3</LedgerTag>
            <span className="text-muted-foreground font-mono text-xs">
              {status === "configuring" && "Awaiting survey parameters"}
              {status === "running" && `Surveying, year ${last?.year ?? 0}`}
              {status === "paused" && "Survey paused"}
              {status === "complete" && "Survey complete"}
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", running ? "bg-accent animate-pulse" : "bg-success")} />
            {running ? "live" : "idle"}
          </span>
        </div>
        <CardContent className="px-5 py-5">
          <FieldMap
            scenario={scenario}
            native={last?.native ?? NATIVE_START}
            invasive={last?.invasive ?? params.initialInvasive}
            appliedStrategies={appliedStrategies}
          />
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader className="gap-1 px-5">
          <CardTitle className="text-base">Choose your field site</CardTitle>
          <CardDescription>{labels.description}</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <ScenarioPicker value={scenario} disabled={started || readOnly} onChange={(value) => patch({ scenario: value })} />
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader className="gap-1 px-5">
          <CardTitle className="text-base">Survey instruments</CardTitle>
          <CardDescription>Drag each gauge needle to set the starting conditions before you start the survey.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-around gap-4 px-5 pb-5">
          <GaugeDial
            label="Initial invasive population"
            description="How many invasive individuals are introduced to the habitat before the survey begins."
            value={params.initialInvasive}
            min={5}
            max={100}
            step={5}
            disabled={started || readOnly}
            onChange={(v) => patch({ params: { ...params, initialInvasive: v } })}
          />
          <GaugeDial
            label="Invasive growth rate"
            description="How fast the invasive population would multiply each year with no predators or competition holding it back."
            value={params.invasiveGrowthRate}
            min={0.05}
            max={0.6}
            step={0.05}
            unit="%"
            formatValue={(v) => Math.round(v * 100).toString()}
            disabled={started || readOnly}
            onChange={(v) => patch({ params: { ...params, invasiveGrowthRate: v } })}
          />
          <GaugeDial
            label="Predation pressure"
            description="How much natural predation on the invasive species slows its growth rate down."
            value={params.predationPressure}
            min={0}
            max={0.8}
            step={0.05}
            unit="%"
            formatValue={(v) => Math.round(v * 100).toString()}
            disabled={started || readOnly}
            onChange={(v) => patch({ params: { ...params, predationPressure: v } })}
          />
          <GaugeDial
            label="Carrying capacity"
            description="The total population of food, space, and other resources the habitat can support. Both species draw from this same pool."
            value={params.resourceCap}
            min={200}
            max={1000}
            step={50}
            disabled={started || readOnly}
            onChange={(v) => patch({ params: { ...params, resourceCap: v } })}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {!started && (
          <Button onClick={startSimulation} disabled={readOnly}>
            <Play />
            Start survey
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
            End survey now
          </Button>
        )}
        {started && status !== "complete" && (
          <div className="flex items-center gap-1 rounded-md border border-border bg-background/60 p-1">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => patch({ speed: option })}
                className={cn(
                  "rounded px-2 py-1 font-mono text-xs transition-colors",
                  speed === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}x
              </button>
            ))}
          </div>
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

      {started && (
        <Card className="gap-4 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Deploy a management strategy</CardTitle>
            <CardDescription>Each tool can only be deployed once per survey.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5 px-5 pb-5 sm:grid-cols-3">
            {Object.entries(MANAGEMENT_STRATEGIES).map(([id, info]) => {
              const Icon = STRATEGY_ICON[id as ManagementStrategyId];
              const applied = appliedStrategies.includes(id as ManagementStrategyId);
              const disabled = readOnly || status === "complete" || status === "configuring" || applied;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={disabled}
                  onClick={() => applyStrategy(id as ManagementStrategyId)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-md border p-3 text-left transition-colors",
                    applied ? "border-success/50 bg-success/5" : "border-border bg-background/60",
                    !disabled && "hover:border-foreground/30",
                    disabled && !applied && "opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full",
                      applied ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-sm font-medium">{info.label}</span>
                  <span className="text-muted-foreground text-xs leading-snug">{info.description}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {started && (
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Population over time</CardTitle>
            <CardDescription>
              Year {last?.year ?? 0} of {MAX_YEARS}
              {status === "running" && ", running"}
              {status === "complete" && ", survey complete"}
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-grid-faint px-5 pb-5">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ left: 0, right: 16, top: 56, bottom: 0 }}>
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
                      label={{
                        value: MANAGEMENT_STRATEGIES[e.strategy].label,
                        fontSize: 10,
                        position: "top",
                        offset: 10 + i * 16,
                      }}
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
          </CardContent>
        </Card>
      )}

      {status === "complete" && diversityChangePct !== null && (
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Biodiversity impact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-5 pb-5 text-sm">
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

      {history.length > 0 && gradingView && (
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Year-by-year log</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto px-5 pb-5">
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
