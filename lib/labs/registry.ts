import type { ComponentType } from "react";
import type { Database } from "@/lib/supabase/types";
import type { LabComponentProps } from "@/lib/labs/types";
import { MillerUreyLab } from "@/components/labs/miller-urey/miller-urey-lab";
import { EndosymbiosisLab } from "@/components/labs/endosymbiosis/endosymbiosis-lab";
import { InvasiveSpeciesLab } from "@/components/labs/invasive-species/invasive-species-lab";
import { BiomagnificationLab } from "@/components/labs/biomagnification/biomagnification-lab";

export type LabSlug = Database["public"]["Tables"]["lab_templates"]["Row"]["slug"];

export const LAB_REGISTRY: Record<LabSlug, ComponentType<LabComponentProps>> = {
  "miller-urey": MillerUreyLab,
  endosymbiosis: EndosymbiosisLab,
  "invasive-species": InvasiveSpeciesLab,
  biomagnification: BiomagnificationLab,
};
