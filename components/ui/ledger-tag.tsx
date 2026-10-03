import { cn } from "@/lib/utils";

export function LedgerTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted/50 px-2 py-0.5 font-mono text-[0.7rem] tracking-wide text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
