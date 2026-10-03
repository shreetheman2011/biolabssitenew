export type Scenario = "lake" | "field" | "forest";

export const SCENARIOS: Record<Scenario, { nativeLabel: string; invasiveLabel: string; description: string }> = {
  lake: {
    nativeLabel: "Native sunfish",
    invasiveLabel: "Invasive silver carp",
    description: "A lake ecosystem where silver carp compete with native sunfish for food and space.",
  },
  field: {
    nativeLabel: "Native wildflowers",
    invasiveLabel: "Invasive knapweed",
    description: "A grassland where spotted knapweed spreads aggressively into native wildflower territory.",
  },
  forest: {
    nativeLabel: "Native longhorn beetle",
    invasiveLabel: "Invasive emerald borer",
    description: "A forest where an invasive borer beetle competes with a native beetle species for host trees.",
  },
};

export const NATIVE_START = 300;
export const NATIVE_GROWTH_RATE = 0.15;
export const COMPETITION_NATIVE_FROM_INVASIVE = 1.3;
export const COMPETITION_INVASIVE_FROM_NATIVE = 0.4;
export const MAX_YEARS = 25;

export type SimParams = {
  initialInvasive: number;
  invasiveGrowthRate: number;
  predationPressure: number;
  resourceCap: number;
};

export const DEFAULT_PARAMS: SimParams = {
  initialInvasive: 20,
  invasiveGrowthRate: 0.3,
  predationPressure: 0.1,
  resourceCap: 600,
};

export type YearPoint = { year: number; native: number; invasive: number };

export type ManagementStrategyId = "biological_control" | "trapping" | "barrier";

export const MANAGEMENT_STRATEGIES: Record<
  ManagementStrategyId,
  { label: string; description: string }
> = {
  biological_control: {
    label: "Biological control",
    description: "Introduce a predator or pathogen specific to the invasive species, cutting its growth rate in half from now on.",
  },
  trapping: {
    label: "Trapping / culling",
    description: "Physically remove invasive individuals right now, cutting the current population by 40%.",
  },
  barrier: {
    label: "Barrier / containment",
    description: "Fence off resources so the invasive species can support fewer individuals going forward.",
  },
};

export type Modifiers = { growthMultiplier: number; capMultiplier: number };

export const DEFAULT_MODIFIERS: Modifiers = { growthMultiplier: 1, capMultiplier: 1 };

export function stepYear(
  native: number,
  invasive: number,
  params: SimParams,
  modifiers: Modifiers
): { native: number; invasive: number } {
  const effectiveInvasiveGrowth =
    params.invasiveGrowthRate * (1 - params.predationPressure) * modifiers.growthMultiplier;
  const sharedCap = Math.max(50, params.resourceCap);
  const effectiveInvasiveCap = Math.max(50, params.resourceCap * modifiers.capMultiplier);

  const nextNative =
    native +
    NATIVE_GROWTH_RATE * native * (1 - (native + COMPETITION_NATIVE_FROM_INVASIVE * invasive) / sharedCap);
  const nextInvasive =
    invasive +
    effectiveInvasiveGrowth *
      invasive *
      (1 - (invasive + COMPETITION_INVASIVE_FROM_NATIVE * native) / effectiveInvasiveCap);

  return {
    native: Math.max(0, Math.round(nextNative)),
    invasive: Math.max(0, Math.round(nextInvasive)),
  };
}

export function shannonIndex(native: number, invasive: number): number {
  const total = native + invasive;
  if (total === 0) return 0;
  const pNative = native / total;
  const pInvasive = invasive / total;
  const term = (p: number) => (p > 0 ? -p * Math.log(p) : 0);
  return term(pNative) + term(pInvasive);
}
