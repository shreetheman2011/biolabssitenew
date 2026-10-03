export type GasMixture = {
  ch4: boolean;
  nh3: boolean;
  h2: boolean;
  h2o: boolean;
};

export const GAS_INFO: Record<keyof GasMixture, { formula: string; name: string; role: string }> = {
  ch4: {
    formula: "CH4",
    name: "Methane",
    role: "The carbon source. Every organic compound in the trap needs a carbon backbone, and methane is where that carbon comes from.",
  },
  nh3: {
    formula: "NH3",
    name: "Ammonia",
    role: "The nitrogen source. Amino acids all contain nitrogen, so without ammonia in the mix none can form, no matter how much energy you add.",
  },
  h2: {
    formula: "H2",
    name: "Hydrogen",
    role: "Pushes the mixture into a more reducing, oxygen-poor state, which is what early Earth's atmosphere is thought to have been like. More reducing conditions let more complex amino acids form.",
  },
  h2o: {
    formula: "H2O",
    name: "Water vapor",
    role: "The medium the whole reaction happens in. Heating it is what keeps vapor circulating past the spark gap and down into the condenser.",
  },
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

export const COMPOUND_INFO: Record<string, { label: string; kind: "amino-acid" | "precursor"; description: string }> = {
  formaldehyde: {
    label: "Formaldehyde",
    kind: "precursor",
    description: "A simple carbon compound formed early in the reaction. It is not an amino acid itself, but it is a building block the later steps use.",
  },
  "hydrogen cyanide": {
    label: "Hydrogen cyanide",
    kind: "precursor",
    description: "A simple carbon-nitrogen compound. Combined with formaldehyde, it is one of the key intermediates on the path to glycine.",
  },
  glycine: {
    label: "Glycine",
    kind: "amino-acid",
    description: "The simplest amino acid, and the one Miller and Urey actually detected in highest quantity in the original 1952 experiment.",
  },
  alanine: {
    label: "Alanine",
    kind: "amino-acid",
    description: "A slightly larger amino acid than glycine. It only forms when hydrogen pushes the mixture into a more strongly reducing state.",
  },
  "aspartic acid": {
    label: "Aspartic acid",
    kind: "amino-acid",
    description: "A larger, more complex amino acid. Its presence is evidence that the reaction had enough energy and reducing power to build more than the simplest products.",
  },
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
