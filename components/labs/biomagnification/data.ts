export type TrophicLevel = "producer" | "primary" | "secondary" | "tertiary";

export const TROPHIC_LEVELS: TrophicLevel[] = ["producer", "primary", "secondary", "tertiary"];

export const TROPHIC_LEVEL_LABELS: Record<TrophicLevel, string> = {
  producer: "Producer",
  primary: "Primary consumer",
  secondary: "Secondary consumer",
  tertiary: "Tertiary consumer",
};

export const TROPHIC_LEVEL_DESCRIPTIONS: Record<TrophicLevel, string> = {
  producer: "Makes its own food from sunlight. It absorbs whatever pollutant is in the water or soil around it at a low, dilute concentration.",
  primary: "Eats producers directly. Because it eats a large volume of plant or algae matter over its lifetime, the pollutant inside all of that food ends up stored in one body.",
  secondary: "Eats several primary consumers over its lifetime, so it inherits all of the pollutant each of those prey animals had already built up.",
  tertiary: "An apex predator that eats many secondary consumers. It ends up with the highest pollutant load of all, even though it was never directly exposed to the pollutant's source.",
};

export type Organism = {
  id: string;
  label: string;
  level: TrophicLevel;
};

export const ORGANISMS: Organism[] = [
  { id: "phytoplankton", label: "Phytoplankton", level: "producer" },
  { id: "algae", label: "Algae", level: "producer" },
  { id: "grass", label: "Grass", level: "producer" },
  { id: "zooplankton", label: "Zooplankton", level: "primary" },
  { id: "grasshopper", label: "Grasshopper", level: "primary" },
  { id: "vole", label: "Vole", level: "primary" },
  { id: "small_fish", label: "Small fish (perch)", level: "secondary" },
  { id: "frog", label: "Frog", level: "secondary" },
  { id: "shrew", label: "Shrew", level: "secondary" },
  { id: "osprey", label: "Osprey", level: "tertiary" },
  { id: "heron", label: "Heron", level: "tertiary" },
  { id: "owl", label: "Owl", level: "tertiary" },
];

export const DEFAULT_PRODUCER_CONCENTRATION = 0.5;
export const DEFAULT_RATIOS: [number, number, number] = [5, 4, 6];

export function computeChainConcentrations(
  producerConcentration: number,
  ratios: [number, number, number]
): number[] {
  const concentrations = [producerConcentration];
  for (const ratio of ratios) {
    concentrations.push(concentrations[concentrations.length - 1] * ratio);
  }
  return concentrations;
}
