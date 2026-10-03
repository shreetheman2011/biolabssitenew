import Link from "next/link";
import {
  ArrowRight,
  Bug,
  ClipboardCheck,
  Dna,
  FlaskConical,
  Fish,
  GraduationCap,
  LineChart,
  MailCheck,
  Save,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpecimenStack } from "@/components/marketing/specimen-stack";

const LABS = [
  {
    code: "MU-01",
    icon: FlaskConical,
    title: "The Miller-Urey experiment",
    category: "Origin of life",
    dot: "bg-primary",
    body: "Mix early-Earth gases, strike a simulated spark, and find out which amino acids actually form in the collection trap.",
  },
  {
    code: "ES-02",
    icon: Dna,
    title: "Endosymbiotic theory",
    category: "Origin of life",
    dot: "bg-primary",
    body: "Sort real cellular evidence into supports and doesn't support, then arrange the timeline from free-living cell to organelle.",
  },
  {
    code: "IS-03",
    icon: Bug,
    title: "Invasive species",
    category: "Ecology",
    dot: "bg-accent",
    body: "Set population parameters, run years of competition between native and invasive species, and test a management strategy mid-run.",
  },
  {
    code: "BM-04",
    icon: Fish,
    title: "Biomagnification",
    category: "Ecology",
    dot: "bg-accent",
    body: "Build a food chain by hand and watch a pollutant concentrate exponentially from producer up to apex predator.",
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Classes with join codes",
    body: "Make a class, get a six-character code, and students are in before the bell rings.",
  },
  {
    icon: Save,
    title: "Autosaving lab journals",
    body: "Nobody loses a trial because the school wifi dropped for ten seconds. Every click saves.",
  },
  {
    icon: LineChart,
    title: "Numeric or rubric grading",
    body: "Grade on a 100-point scale or build a rubric with as many criteria as your department wants. Both leave room for comments.",
  },
  {
    icon: MailCheck,
    title: "Instant grade emails",
    body: "Post a grade and the student has it in their inbox before you've opened the next submission.",
  },
  {
    icon: ClipboardCheck,
    title: "A real gradebook",
    body: "Open any submission and see exactly what the student did in the simulation, not just a final number.",
  },
  {
    icon: GraduationCap,
    title: "Built for the classroom",
    body: "Attempt limits, due dates, drafts you haven't posted yet. It works the way an assignment actually works.",
  },
];

const STEPS = [
  {
    title: "Create a class",
    body: "Name it, and you'll get a join code and a link to hand out.",
  },
  {
    title: "Post a lab",
    body: "Pick a lab, set a due date and attempt policy, and choose numeric or rubric grading.",
  },
  {
    title: "Grade and done",
    body: "Review each student's lab replay and journal, then post a grade with feedback. They're emailed right away.",
  },
];

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col">
      <section className="bg-grid-faint relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex max-w-xl flex-col gap-6">
            <h1 className="font-display text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl">
              A field notebook for the biology classroom
            </h1>
            <p className="text-muted-foreground max-w-md text-lg">
              Labs built from real experiments, classes your students join with a
              six-character code, and a gradebook that emails the grade even if you close the
              tab before it sends.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/signup?role=teacher">
                  Start teaching
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup?role=student">I have a join code</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <SpecimenStack />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="font-display text-3xl font-medium">The labs</h2>
          <p className="text-muted-foreground max-w-md">
            Experiments every bio curriculum covers, rebuilt as things students run instead
            of read about.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {LABS.map((lab) => (
            <div key={lab.code} className="flex flex-col gap-4 bg-card p-6">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs tracking-wide text-muted-foreground">
                  {lab.code}
                </span>
                <lab.icon className="text-primary size-6" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${lab.dot}`} />
                  {lab.category}
                </span>
                <p className="font-display text-lg font-medium">{lab.title}</p>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{lab.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-3xl font-medium">
              The gradebook side
            </h2>
            <p className="text-muted-foreground max-w-xs">
              Thirty kids, one due date, and a stack of lab work to get through. This is the
              part that handles that.
            </p>
          </div>
          <div className="flex flex-col">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 border-t border-border py-5 first:border-t-0 sm:py-6"
              >
                <feature.icon className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
                <div className="flex flex-col gap-1">
                  <p className="font-display font-medium">{feature.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display mb-10 text-3xl font-medium">How it works</h2>
        <ol className="flex max-w-xl flex-col">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex gap-5 pb-10 last:pb-0">
              {i < STEPS.length - 1 && (
                <span className="absolute top-8 left-[0.95rem] h-full w-px bg-border" />
              )}
              <span className="font-display text-primary relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1 pt-0.5">
                <p className="font-display font-medium">{step.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-20">
          <h2 className="font-display max-w-xl text-3xl font-medium">
            Your first class takes less time than taking attendance
          </h2>
          <p className="text-muted-foreground max-w-md">
            Make an account, make a class, and your students can join with a code before the
            period&apos;s over.
          </p>
          <Button asChild size="lg" className="w-fit">
            <Link href="/signup?role=teacher">
              Create your teacher account
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
