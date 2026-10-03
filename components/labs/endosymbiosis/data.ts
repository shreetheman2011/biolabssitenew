export type SortBin = "unsorted" | "supports" | "doesnt_support";

export type EvidenceCard = {
  id: string;
  title: string;
  detail: string;
  correctBin: "supports" | "doesnt_support";
};

export const EVIDENCE_CARDS: EvidenceCard[] = [
  {
    id: "double_membrane",
    title: "Double membrane",
    detail:
      "Mitochondria and chloroplasts are wrapped in two membranes: an inner one that matches a bacterial cell membrane, and an outer one that looks like it came from the host's engulfing vesicle.",
    correctBin: "supports",
  },
  {
    id: "circular_dna",
    title: "Own circular DNA",
    detail:
      "Both organelles carry a small, circular DNA genome, separate from the cell's nuclear DNA. It's the same genome shape bacteria use, not the linear chromosomes found in the nucleus.",
    correctBin: "supports",
  },
  {
    id: "binary_fission",
    title: "Reproduces by binary fission",
    detail:
      "Mitochondria and chloroplasts divide on their own schedule, splitting in two the way bacteria do, instead of being built fresh by the cell's normal mitosis machinery.",
    correctBin: "supports",
  },
  {
    id: "ribosome_size",
    title: "Bacteria-sized ribosomes",
    detail:
      "The ribosomes inside mitochondria and chloroplasts are the smaller 70S bacterial type, not the larger 80S type used by the rest of the eukaryotic cell's cytoplasm.",
    correctBin: "supports",
  },
  {
    id: "antibiotic_sensitivity",
    title: "Sensitive to bacterial antibiotics",
    detail:
      "Antibiotics like streptomycin, which block bacterial protein synthesis, also disrupt protein synthesis inside mitochondria and chloroplasts, but not in the rest of the host cell.",
    correctBin: "supports",
  },
  {
    id: "phylogenetics",
    title: "DNA matches living bacteria",
    detail:
      "Mitochondrial DNA sequences are most similar to alpha-proteobacteria, and chloroplast DNA is most similar to cyanobacteria, specific bacterial groups still alive today.",
    correctBin: "supports",
  },
  {
    id: "ubiquity",
    title: "Found in almost every eukaryotic cell",
    detail:
      "Mitochondria appear in nearly all eukaryotic cells. This tells you the relationship is ancient and essential, but being common everywhere doesn't by itself say anything about how the organelle originated.",
    correctBin: "doesnt_support",
  },
  {
    id: "small_size",
    title: "Organelles are small",
    detail:
      "Mitochondria and chloroplasts are much smaller than the host cell. Lots of cell structures are small for reasons that have nothing to do with having once been free-living, so size alone isn't diagnostic.",
    correctBin: "doesnt_support",
  },
  {
    id: "visible_light_microscope",
    title: "Visible under a light microscope",
    detail:
      "Mitochondria are just barely large enough to be seen with a basic light microscope. That's a statement about their size, not about where they came from.",
    correctBin: "doesnt_support",
  },
];

export type TimelineStage = {
  id: string;
  title: string;
  description: string;
};

export const STAGE_ORDER = ["free_living", "engulfment", "symbiosis", "organelle"] as const;

export const TIMELINE_STAGES: Record<string, TimelineStage> = {
  free_living: {
    id: "free_living",
    title: "Free-living prokaryote",
    description:
      "An aerobic (or photosynthetic) bacterium lives independently, meeting all of its own energy needs.",
  },
  engulfment: {
    id: "engulfment",
    title: "Engulfment",
    description:
      "A larger host cell takes in the prokaryote, likely by phagocytosis, but fails to digest it, so the two end up sharing one cell.",
  },
  symbiosis: {
    id: "symbiosis",
    title: "Stable symbiosis",
    description:
      "The engulfed prokaryote starts supplying energy (or sugars, if photosynthetic) to the host in exchange for protection and nutrients. Both benefit, and neither can easily leave the relationship.",
  },
  organelle: {
    id: "organelle",
    title: "Modern organelle",
    description:
      "After generations of genome reduction, the former prokaryote can no longer survive on its own. It is now a fully integrated mitochondrion or chloroplast.",
  },
};

export const INITIAL_SHUFFLED_STAGE_ORDER = ["symbiosis", "free_living", "organelle", "engulfment"];
