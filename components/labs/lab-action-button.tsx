import { Button } from "@/components/ui/button";
import { startOrResumeAttemptAction } from "@/lib/actions/submissions";

export function LabActionButton({
  assignmentId,
  label,
  variant = "default",
}: {
  assignmentId: string;
  label: string;
  variant?: "default" | "outline" | "secondary";
}) {
  return (
    <form action={startOrResumeAttemptAction.bind(null, assignmentId)}>
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}
