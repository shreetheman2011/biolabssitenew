"use client";

import { useRef, useState } from "react";
import { Zap, Thermometer, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Apparatus, type ApparatusPhase } from "./apparatus";
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

export function MillerUreyLab({ simState, onSimStateChange, readOnly }: LabComponentProps) {
  const state = simState as Partial<MillerUreySimState>;
  const gases: GasMixture = state.gases ?? DEFAULT_GASES;
  const heat = state.heat ?? false;
  const sparkEnabled = state.sparkEnabled ?? false;
  const trials: Trial[] = state.trials ?? [];

  const [phase, setPhase] = useState<ApparatusPhase>("idle");
  const [lastCompounds, setLastCompounds] = useState<string[] | null>(null);
  const runId = useRef(0);

  function patch(next: Partial<MillerUreySimState>) {
    onSimStateChange({ gases, heat, sparkEnabled, trials, ...next });
  }

  function toggleGas(key: keyof GasMixture) {
    patch({ gases: { ...gases, [key]: !gases[key] } });
  }

  async function handleRunTrial() {
    const myRun = ++runId.current;
    setLastCompounds(null);

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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>The apparatus</CardTitle>
          <CardDescription>
            Choose a gas mixture, heat the flask, decide whether to strike a spark, then run the trial.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <Apparatus
            phase={phase}
            heat={heat}
            sparkEnabled={sparkEnabled}
            hasCompounds={lastCompounds ? lastCompounds.length > 0 : null}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4" />
              Atmospheric gases
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-6">
            {Object.entries(GAS_INFO).map(([key, info]) => (
              <div key={key} className="flex items-center gap-2.5">
                <Checkbox
                  id={`gas-${key}`}
                  checked={gases[key as keyof GasMixture]}
                  disabled={readOnly || phase !== "idle"}
                  onCheckedChange={() => toggleGas(key as keyof GasMixture)}
                />
                <Label htmlFor={`gas-${key}`} className="font-normal">
                  {info.name} <span className="text-muted-foreground">({info.formula})</span>
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conditions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pb-6">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="heat-switch" className="flex items-center gap-2 font-normal">
                <Thermometer className="size-4" />
                Heat the flask
              </Label>
              <Switch
                id="heat-switch"
                checked={heat}
                disabled={readOnly || phase !== "idle"}
                onCheckedChange={(checked) => patch({ heat: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="spark-switch" className="flex items-center gap-2 font-normal">
                <Zap className="size-4" />
                Strike simulated lightning
              </Label>
              <Switch
                id="spark-switch"
                checked={sparkEnabled}
                disabled={readOnly || phase !== "idle"}
                onCheckedChange={(checked) => patch({ sparkEnabled: checked })}
              />
            </div>
            <Button
              onClick={handleRunTrial}
              disabled={readOnly || phase === "circulating" || phase === "sparking" || phase === "condensing"}
            >
              Run trial
            </Button>
          </CardContent>
        </Card>
      </div>

      {lastCompounds !== null && phase === "result" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection trap results</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            {lastCompounds.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No organic compounds detected this trial. Check your gas mixture and conditions.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lastCompounds.map((c) => (
                  <Badge key={c} variant={COMPOUND_INFO[c]?.kind === "amino-acid" ? "success" : "secondary"}>
                    {COMPOUND_INFO[c]?.label ?? c}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {trials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trial log</CardTitle>
            <CardDescription>{trials.length} trial{trials.length === 1 ? "" : "s"} run</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
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
    </div>
  );
}
