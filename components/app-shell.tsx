import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { AppSidebar, type NavItem } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";

export function AppShell({
  nav,
  fullName,
  email,
  homeHref,
  children,
}: {
  nav: NavItem[];
  fullName: string;
  email: string;
  homeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <Link href={homeHref} className="flex items-center gap-2 font-display text-[1.05rem] font-medium">
            <FlaskConical className="text-primary size-5" strokeWidth={1.75} />
            Verdant Labs
          </Link>
        </div>
        <AppSidebar nav={nav} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
          <Link href={homeHref} className="flex items-center gap-2 font-display text-[1.05rem] font-medium md:hidden">
            <FlaskConical className="text-primary size-5" strokeWidth={1.75} />
            Verdant Labs
          </Link>
          <div className="ml-auto">
            <UserMenu fullName={fullName} email={email} />
          </div>
        </header>
        <div className="border-b border-border md:hidden">
          <AppSidebar nav={nav} />
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
