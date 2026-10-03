import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Log in to your Verdant Labs account.
        </p>
      </div>
      <LoginForm next={next} />
      <p className="text-muted-foreground text-sm">
        Don&apos;t have an account?{" "}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
