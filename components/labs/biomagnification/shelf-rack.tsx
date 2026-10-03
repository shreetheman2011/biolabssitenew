export function ShelfRack() {
  return (
    <div
      className="relative mt-1.5 h-3.5 w-full rounded-[2px]"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklch, var(--accent) 55%, var(--background) 10%) 0%, color-mix(in oklch, var(--accent) 40%, var(--foreground) 18%) 100%)",
        boxShadow: "0 2px 4px color-mix(in oklch, var(--foreground) 15%, transparent)",
      }}
      aria-hidden
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "color-mix(in oklch, var(--accent) 75%, var(--background) 15%)" }}
      />
    </div>
  );
}
