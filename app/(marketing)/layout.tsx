import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-medium">
            <FlaskConical className="text-primary size-5" strokeWidth={1.75} />
            Verdant Labs
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup?role=teacher">Start teaching</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-display font-medium text-foreground">
            <FlaskConical className="text-primary size-4" strokeWidth={1.75} />
            Verdant Labs
          </div>
          <p>Real labs. Real classes. No worksheets pretending to be labs.</p>
        </div>
      </footer>
    </div>
  );
}
