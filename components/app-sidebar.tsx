"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exactMatchOnly?: boolean;
};

export function AppSidebar({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col py-3">
      {nav.map((item) => {
        const active = item.exactMatchOnly
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 border-l-2 px-4 py-2 text-sm transition-colors",
              active
                ? "border-l-primary bg-sidebar-accent/50 font-medium text-sidebar-accent-foreground"
                : "border-l-transparent text-sidebar-foreground/65 hover:border-l-border hover:text-sidebar-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
