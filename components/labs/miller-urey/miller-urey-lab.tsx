"use client";

import { useRef, useState } from "react";
import { Check, Info, X, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LedgerTag } from "@/components/ui/ledger-tag";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Apparatus, type ApparatusPhase } from "./apparatus";
import { ControlKnob } from "./control-knob";
import { LeverSwitch } from "./lever-switch";
import {
  COMPOUND_INFO,
  DEFAULT_GASES,
  GAS_INFO,
  runTrial,
  type GasMixture,
  type MillerUreySimState,
  type Trial,
} from "./chemistry";
import type { LabComponentProps } from "@/lib/labs/types";

const PHASE_DURATIONS: Record<ApparatusPhase, number> = {
  idle: 0,
  circulating: 1300,
  sparking: 700,
  condensing: 1100,
  result: 0,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function explainEmptyResult(heat: boolean, sparkEnabled: boolean, gases: GasMixture): string {
  if (!heat) return "The flask was never heated, so water vapor never circulated up to the spark gap.";
  if (!sparkEnabled) return "No spark means there was no energy available to break any bonds.";
  if (!gases.h2o) return "Without water vapor open there was no medium for a reaction to happen in.";
  return "Heat, water vapor, and a spark were all present, but no carbon or nitrogen source was open to build a compound from.";
}

const HYPOTHESIS_PROMPT_ID = "hypothesis";
const HYPOTHESIS_QUESTION =
  "Before running any trials, predict: if Earth's early atmosphere was mostly methane, ammonia, hydrogen, and water vapor, and lightning struck repeatedly, what kinds of molecules do you think could form in the ocean below? Explain your reasoning.";

export function MillerUreyLab({
  simState,
  onSimStateChange,
  readOnly,
  journalResponses,
  onJournalResponseChange,
}: LabComponentProps) {
  const state = simState as Partial<MillerUreySimState>;
  const gases: GasMixture = state.gases ?? DEFAULT_GASES;
  const heat = state.heat ?? false;
  const sparkEnabled = state.sparkEnabled ?? false;
  const trials: Trial[] = state.trials ?? [];

  const [phase, setPhase] = useState<ApparatusPhase>("idle");
  const [lastCompounds, setLastCompounds] = useState<string[] | null>(null);
  const runId = useRef(0);

  const hypothesisAnswer = (journalResponses?.answers[HYPOTHESIS_PROMPT_ID] as string | undefined) ?? "";
  const [showHypothesisPrompt, setShowHypothesisPrompt] = useState(false);
  const [hypothesisDraft, setHypothesisDraft] = useState("");

  function patch(next: Partial<MillerUreySimState>) {
    onSimStateChange?.({ gases, heat, sparkEnabled, trials, ...next });
  }

  function toggleGas(key: keyof GasMixture) {
    if (phase === "result") {
      setPhase("idle");
      setLastCompounds(null);
    }
    patch({ gases: { ...gases, [key]: !gases[key] } });
  }

  function setCondition(next: Partial<Pick<MillerUreySimState, "heat" | "sparkEnabled">>) {
    if (phase === "result") {
      setPhase("idle");
      setLastCompounds(null);
    }
    patch(next);
  }

  async function runTrialAnimation() {
    const myRun = ++runId.current;
    setLastCompounds(null);
    document.getElementById("miller-urey-apparatus")?.scrollIntoView({ behavior: "smooth", block: "start" });

    setPhase("circulating");
    await wait(PHASE_DURATIONS.circulating);
    if (runId.current !== myRun) return;

    if (sparkEnabled) {
      setPhase("sparking");
      await wait(PHASE_DURATIONS.sparking);
      if (runId.current !== myRun) return;
    }

    setPhase("condensing");
    await wait(PHASE_DURATIONS.condensing);
    if (runId.current !== myRun) return;

    const compounds = runTrial(gases, heat, sparkEnabled);
    setLastCompounds(compounds);
    setPhase("result");

    const trial: Trial = {
      id: crypto.randomUUID(),
      gases,
      heat,
      sparked: sparkEnabled,
      compounds,
      ranAt: new Date().toISOString(),
    };
    patch({ trials: [...trials, trial] });
  }

  function handleRunTrial() {
    if (trials.length === 0 && !hypothesisAnswer.trim()) {
      setHypothesisDraft(hypothesisAnswer);
      setShowHypothesisPrompt(true);
      return;
    }
    runTrialAnimation();
  }

  function submitHypothesisAndRun() {
    if (!hypothesisDraft.trim()) return;
    onJournalResponseChange?.(HYPOTHESIS_PROMPT_ID, hypothesisDraft);
    setShowHypothesisPrompt(false);
    runTrialAnimation();
  }

  const running = phase === "circulating" || phase === "sparking" || phase === "condensing";
  const locked = readOnly || running;
  const phaseLabel: Record<ApparatusPhase, string> = {
    idle: "Standing by",
    circulating: "Circulating vapor",
    sparking: "Discharging spark",
    condensing: "Condensing droplets",
    result: "Trial complete",
  };

  const REQUIREMENTS = [
    { label: "Heat on", met: heat },
    { label: "Water vapor open", met: gases.h2o },
    { label: "Spark struck", met: sparkEnabled },
    { label: "Carbon source (CH4) open", met: gases.ch4 },
    { label: "Nitrogen source (NH3) open", met: gases.nh3 },
    { label: "Hydrogen (H2) open", met: gases.h2 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card id="miller-urey-apparatus" className="overflow-hidden border-foreground/15 bg-[linear-gradient(180deg,var(--muted)_0%,var(--background)_60%)] py-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <LedgerTag>Bench 1</LedgerTag>
            <span className="text-muted-foreground font-mono text-xs">{phaseLabel[phase]}</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", running ? "bg-accent animate-pulse" : "bg-success")} />
            {running ? "running" : "idle"}
          </span>
        </div>
        <CardContent className="bg-grid-faint px-5 py-5">
          <div className="mb-4 flex flex-col gap-1.5">
            <p className="text-sm">
              In 1952, Stanley Miller and Harold Urey sealed water, methane, ammonia, and hydrogen into a closed loop
              of glass, heated it to boil the water, and ran an electric spark through the gas to stand in for
              lightning. They were testing whether the simple molecules thought to make up early Earth&apos;s
              atmosphere could assemble themselves into the amino acids life is built from, with no living thing
              involved.
            </p>
            <p className="text-muted-foreground text-sm">
              Open the valves below to choose your gas mixture, then heat the flask and strike the spark, and run
              the trial to see what condenses into the collection trap.
            </p>
          </div>
          <Apparatus
            phase={phase}
            heat={heat}
            sparkEnabled={sparkEnabled}
            hasCompounds={lastCompounds ? lastCompounds.length > 0 : null}
            compounds={lastCompounds ?? undefined}
          />
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader className="gap-1 px-5">
          <CardTitle className="text-base">Gas manifold</CardTitle>
          <CardDescription>Open each valve to admit that gas into the flask before you run the trial.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 px-5 pb-5">
          {Object.entries(GAS_INFO).map(([key, info]) => (
            <ControlKnob
              key={key}
              label={info.name}
              sublabel={info.formula}
              description={info.role}
              open={gases[key as keyof GasMixture]}
              disabled={locked}
              onToggle={() => toggleGas(key as keyof GasMixture)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <LeverSwitch
          label="Heat the flask"
          description="Drives circulation of water vapor through the apparatus."
          on={heat}
          disabled={locked}
          onToggle={() => setCondition({ heat: !heat })}
        />
        <LeverSwitch
          label="Strike simulated lightning"
          description="Fires the spark gap to supply bond-breaking energy."
          on={sparkEnabled}
          hazard
          disabled={locked}
          onToggle={() => setCondition({ sparkEnabled: !sparkEnabled })}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5">
        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          reaction conditions
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Why these conditions matter"
            >
              <Info className="size-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-center">
              Heat, water vapor, and a spark are required before anything can react at all. Which gases you have
              open then decides which specific compounds, if any, are able to form.
            </TooltipContent>
          </Tooltip>
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs">
          {REQUIREMENTS.map((r) => (
            <span
              key={r.label}
              className={cn("flex items-center gap-1", r.met ? "text-success" : "text-muted-foreground")}
            >
              {r.met ? <Check className="size-3" /> : <X className="size-3" />}
              {r.label}
            </span>
          ))}
        </div>
      </div>

      <Button size="lg" className="w-full sm:w-auto" onClick={handleRunTrial} disabled={readOnly || running}>
        <Zap />
        {running ? phaseLabel[phase] : "Run trial"}
      </Button>

      {lastCompounds !== null && phase === "result" && (
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Collection trap results</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {lastCompounds.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No organic compounds detected this trial. {explainEmptyResult(heat, sparkEnabled, gases)}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lastCompounds.map((c) => (
                  <Tooltip key={c}>
                    <TooltipTrigger asChild>
                      <Badge variant={COMPOUND_INFO[c]?.kind === "amino-acid" ? "success" : "secondary"}>
                        {COMPOUND_INFO[c]?.label ?? c}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-56 text-center">
                      {COMPOUND_INFO[c]?.description ?? ""}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {trials.length > 0 && (
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-base">Trial log</CardTitle>
            <CardDescription>{trials.length} trial{trials.length === 1 ? "" : "s"} run</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Gases</TableHead>
                  <TableHead>Heat</TableHead>
                  <TableHead>Spark</TableHead>
                  <TableHead>Compounds detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trials.map((trial, i) => (
                  <TableRow key={trial.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {Object.entries(trial.gases)
                        .filter(([, on]) => on)
                        .map(([key]) => GAS_INFO[key as keyof GasMixture].formula)
                        .join(", ") || "none"}
                    </TableCell>
                    <TableCell>{trial.heat ? "On" : "Off"}</TableCell>
                    <TableCell>{trial.sparked ? "On" : "Off"}</TableCell>
                    <TableCell className="text-sm">
                      {trial.compounds.length > 0
                        ? trial.compounds.map((c) => COMPOUND_INFO[c]?.label ?? c).join(", ")
                        : "None detected"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showHypothesisPrompt}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-lg"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Make your prediction first</DialogTitle>
            <DialogDescription>
              Write down what you expect before you watch it happen. You can revise your thinking later in the
              journal, but the prediction has to come first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="miller-urey-hypothesis" className="text-sm font-medium">
              {HYPOTHESIS_QUESTION}
            </label>
            <Textarea
              id="miller-urey-hypothesis"
              rows={5}
              autoFocus
              value={hypothesisDraft}
              onChange={(e) => setHypothesisDraft(e.target.value)}
              placeholder="Type your prediction..."
            />
          </div>
          <DialogFooter>
            <Button onClick={submitHypothesisAndRun} disabled={!hypothesisDraft.trim()}>
              Save prediction and run trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
