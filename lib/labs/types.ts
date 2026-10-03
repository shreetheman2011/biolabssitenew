export type LabComponentProps = {
  simState: Record<string, unknown>;
  onSimStateChange: (next: Record<string, unknown>) => void;
  readOnly: boolean;
};
