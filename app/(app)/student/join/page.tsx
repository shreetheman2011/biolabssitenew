import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { JoinCodeForm } from "./join-code-form";

export default function StudentJoinPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Join a class</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter the 6-character code your teacher shared with you.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enter join code</CardTitle>
          <CardDescription>Codes aren&apos;t case-sensitive.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <JoinCodeForm />
        </CardContent>
      </Card>
    </div>
  );
}
