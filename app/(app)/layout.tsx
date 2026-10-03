import { redirect } from "next/navigation";
import { LayoutDashboard, GraduationCap, UserPlus, School2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-sidebar";

const TEACHER_NAV: NavItem[] = [
  { href: "/teacher", label: "Classes", icon: <School2 className="size-4" />, exactMatchOnly: true },
];

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: <LayoutDashboard className="size-4" />, exactMatchOnly: true },
  { href: "/student/grades", label: "Grades", icon: <GraduationCap className="size-4" /> },
  { href: "/student/join", label: "Join a class", icon: <UserPlus className="size-4" /> },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", userData.user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const isTeacher = profile.role === "teacher";

  return (
    <AppShell
      nav={isTeacher ? TEACHER_NAV : STUDENT_NAV}
      fullName={profile.full_name}
      email={profile.email}
      homeHref={isTeacher ? "/teacher" : "/student"}
    >
      {children}
    </AppShell>
  );
}
