import { FlaskConical, Dna, Bug, Fish, type LucideIcon } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type LabTemplateRow = Database["public"]["Tables"]["lab_templates"]["Row"];

export const LAB_ICONS: Record<LabTemplateRow["slug"], LucideIcon> = {
  "miller-urey": FlaskConical,
  endosymbiosis: Dna,
  "invasive-species": Bug,
  biomagnification: Fish,
};
