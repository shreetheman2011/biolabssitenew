import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JoinButton } from "./join-button";

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();
  const next = `/join/${code}`;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let body: React.ReactNode;

  if (!userData.user) {
    body = (
      <>
        <CardHeader>
          <CardTitle>You&apos;ve been invited to a class</CardTitle>
          <CardDescription>
            Sign up or log in as a student to join with code{" "}
            <span className="font-mono font-medium text-foreground">{code}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-6">
          <Button asChild>
            <Link href={`/signup?role=student&next=${encodeURIComponent(next)}`}>
              Sign up as a student
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
          </Button>
        </CardContent>
      </>
    );
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.role === "teacher") {
      body = (
        <>
          <CardHeader>
            <CardTitle>This link is for students</CardTitle>
            <CardDescription>
              You&apos;re logged in as a teacher. Log in with a student account to join this class.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button asChild variant="outline">
              <Link href="/teacher">Back to your classes</Link>
            </Button>
          </CardContent>
        </>
      );
    } else {
      body = (
        <>
          <CardHeader>
            <CardTitle>Join this class?</CardTitle>
            <CardDescription>
              You&apos;ll be enrolled using code{" "}
              <span className="font-mono font-medium text-foreground">{code}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <JoinButton code={code} />
          </CardContent>
        </>
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="font-display flex items-center gap-2 text-xl font-medium">
        <FlaskConical className="text-primary size-6" strokeWidth={1.75} />
        Verdant Labs
      </Link>
      <Card className="w-full max-w-sm">{body}</Card>
    </div>
  );
}
