import Link from "next/link";
import { FlaskConical, LineChart, MailCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  {
    icon: FlaskConical,
    title: "Full interactive labs",
    body: "Miller-Urey, endosymbiosis, invasive species, and biomagnification, built as real simulations, not slideshows.",
  },
  {
    icon: Users,
    title: "Classes, join codes, rosters",
    body: "Spin up a class in seconds and share a code or link for students to join instantly.",
  },
  {
    icon: LineChart,
    title: "Flexible grading",
    body: "Grade on a numeric scale or a custom rubric, with written feedback either way.",
  },
  {
    icon: MailCheck,
    title: "Instant grade emails",
    body: "The moment you post a grade, your student gets notified automatically.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="bg-grid-faint absolute inset-0 opacity-20" />
        <div className="relative z-10">
          <Link href="/" className="font-display text-xl font-medium">
            Verdant Labs
          </Link>
        </div>
        <div className="relative z-10 flex flex-col">
          {HIGHLIGHTS.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "flex gap-4 border-primary-foreground/15 py-5",
                i > 0 && "border-t"
              )}
            >
              <item.icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="font-display font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-primary-foreground/75">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="relative z-10 text-sm text-primary-foreground/60">
          Built for real science classrooms.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="font-display mb-8 block text-xl font-medium lg:hidden">
            Verdant Labs
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
