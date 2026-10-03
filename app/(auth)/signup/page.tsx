import Link from "next/link";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string }>;
}) {
  const { next, role } = await searchParams;
  const defaultRole = role === "teacher" ? "teacher" : role === "student" ? "student" : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Create your account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set up Verdant Labs for your classroom in a minute.
        </p>
      </div>
      <SignupForm next={next} defaultRole={defaultRole} />
      <p className="text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
