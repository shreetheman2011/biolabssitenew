import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateClassForm } from "./create-class-form";

export default function NewClassPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Create a class</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          You&apos;ll get a join code and link to share with students right after.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Class details</CardTitle>
          <CardDescription>You can edit these later.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <CreateClassForm />
        </CardContent>
      </Card>
    </div>
  );
}
