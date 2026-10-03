export type GasMixture = {
  ch4: boolean;
  nh3: boolean;
  h2: boolean;
  h2o: boolean;
};

export const GAS_INFO: Record<keyof GasMixture, { formula: string; name: string }> = {
  ch4: { formula: "CH4", name: "Methane" },
  nh3: { formula: "NH3", name: "Ammonia" },
  h2: { formula: "H2", name: "Hydrogen" },
  h2o: { formula: "H2O", name: "Water vapor" },
};

export type Trial = {
  id: string;
  gases: GasMixture;
  heat: boolean;
  sparked: boolean;
  compounds: string[];
  ranAt: string;
};

export type MillerUreySimState = {
  gases: GasMixture;
  heat: boolean;
  sparkEnabled: boolean;
  trials: Trial[];
};

export const DEFAULT_GASES: GasMixture = { ch4: true, nh3: true, h2: true, h2o: true };

export const COMPOUND_INFO: Record<string, { label: string; kind: "amino-acid" | "precursor" }> = {
  formaldehyde: { label: "Formaldehyde", kind: "precursor" },
  "hydrogen cyanide": { label: "Hydrogen cyanide", kind: "precursor" },
  glycine: { label: "Glycine", kind: "amino-acid" },
  alanine: { label: "Alanine", kind: "amino-acid" },
  "aspartic acid": { label: "Aspartic acid", kind: "amino-acid" },
};

/**
 * Deterministic rule-based chemistry, mirroring why each gas mattered in the real 1952 run:
 * water is the medium the whole reaction happens in, heat drives circulation, spark supplies
 * the bond-breaking energy, methane is the carbon source, and ammonia is the nitrogen source
 * amino acids require. Hydrogen pushes the reducing environment further, yielding more complex products.
 */
export function runTrial(gases: GasMixture, heat: boolean, sparked: boolean): string[] {
  if (!heat || !sparked || !gases.h2o) return [];

  const compounds: string[] = [];
  if (gases.ch4) compounds.push("formaldehyde");
  if (gases.ch4 && gases.nh3) {
    compounds.push("hydrogen cyanide", "glycine");
  }
  if (gases.ch4 && gases.nh3 && gases.h2) {
    compounds.push("alanine", "aspartic acid");
  }
  return compounds;
}
