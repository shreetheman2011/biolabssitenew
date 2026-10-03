import type { JournalResponses } from "@/lib/supabase/types";

export type LabComponentProps = {
  simState: Record<string, unknown>;
  onSimStateChange?: (next: Record<string, unknown>) => void;
  readOnly: boolean;
  gradingView?: boolean;
  journalResponses?: JournalResponses;
  onJournalResponseChange?: (promptId: string, value: JournalResponses["answers"][string]) => void;
};
