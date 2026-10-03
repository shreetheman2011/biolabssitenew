"use client";

import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CheckCheck, Dna } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LedgerTag } from "@/components/ui/ledger-tag";
import { cn } from "@/lib/utils";
import { CorkboardZone } from "./corkboard-zone";
import { SlideFrame } from "./slide-frame";
import {
  EVIDENCE_CARDS,
  INITIAL_SHUFFLED_STAGE_ORDER,
  STAGE_ORDER,
  TIMELINE_STAGES,
  type SortBin,
} from "./data";
import type { LabComponentProps } from "@/lib/labs/types";

type EndosymbiosisSimState = {
  sorting: Record<string, SortBin>;
  showCheck: boolean;
  timelineOrder: string[];
  stageNotes: Record<string, string>;
};

function defaultSorting(): Record<string, SortBin> {
  return Object.fromEntries(EVIDENCE_CARDS.map((c) => [c.id, "unsorted" as SortBin]));
}

export function EndosymbiosisLab({ simState, onSimStateChange, readOnly, gradingView }: LabComponentProps) {
  const state = simState as Partial<EndosymbiosisSimState>;
  const sorting = state.sorting ?? defaultSorting();
  const showCheck = (state.showCheck ?? false) || !!gradingView;
  const timelineOrder = state.timelineOrder ?? INITIAL_SHUFFLED_STAGE_ORDER;
  const stageNotes = state.stageNotes ?? {};

  const [activeTab, setActiveTab] = useState<"sort" | "timeline">("sort");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function patch(next: Partial<EndosymbiosisSimState>) {
    onSimStateChange?.({ sorting, showCheck, timelineOrder, stageNotes, ...next });
  }

  function handleSortDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const bin = over.id as SortBin;
    if (sorting[active.id as string] === bin) return;
    patch({ sorting: { ...sorting, [active.id as string]: bin }, showCheck: false });
  }

  function handleTimelineDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = timelineOrder.indexOf(active.id as string);
    const to = timelineOrder.indexOf(over.id as string);
    if (from === -1 || to === -1) return;
    patch({ timelineOrder: arrayMove(timelineOrder, from, to) });
  }

  const unsorted = EVIDENCE_CARDS.filter((c) => sorting[c.id] === "unsorted");
  const supports = EVIDENCE_CARDS.filter((c) => sorting[c.id] === "supports");
  const doesntSupport = EVIDENCE_CARDS.filter((c) => sorting[c.id] === "doesnt_support");
  const allSorted = unsorted.length === 0;
  const timelineCorrect = timelineOrder.join(",") === STAGE_ORDER.join(",");
  const correctSortCount = EVIDENCE_CARDS.filter((c) => sorting[c.id] === c.correctBin).length;
  const correctTimelineCount = timelineOrder.filter((id, i) => id === STAGE_ORDER[i]).length;

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden border-foreground/15 bg-[linear-gradient(180deg,var(--muted)_0%,var(--background)_60%)] py-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <LedgerTag>Bench 2</LedgerTag>
            <span className="text-muted-foreground font-mono text-xs">
              {activeTab === "sort" ? "Reviewing cellular evidence" : "Charting the evolutionary record"}
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Dna className="size-3.5" />
            specimen case
          </span>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {(
            [
              { id: "sort" as const, label: "Evidence board" },
              { id: "timeline" as const, label: "Timeline reel" },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative rounded-t-md border border-b-0 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-border bg-background text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-background" />
              )}
            </button>
          ))}
        </div>

        <CardContent className="border-t border-border/70 bg-background px-5 py-5">
          {activeTab === "sort" ? (
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">
                Pin each card to the board where it belongs, then tap a card to read the data behind it. Check your
                work once every card has a home.
              </p>
              <DndContext sensors={sensors} onDragEnd={handleSortDragEnd}>
                <CorkboardZone
                  id="unsorted"
                  title="Unsorted specimens"
                  cards={unsorted}
                  readOnly={readOnly}
                  showCheck={false}
                  tone="neutral"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <CorkboardZone
                    id="supports"
                    title="Supports endosymbiotic theory"
                    cards={supports}
                    readOnly={readOnly}
                    showCheck={showCheck}
                    tone="supports"
                  />
                  <CorkboardZone
                    id="doesnt_support"
                    title="Doesn't support it"
                    cards={doesntSupport}
                    readOnly={readOnly}
                    showCheck={showCheck}
                    tone="doesnt_support"
                  />
                </div>
              </DndContext>
              {gradingView ? (
                <p className="text-sm font-medium">
                  {correctSortCount} of {EVIDENCE_CARDS.length} sorted correctly.
                </p>
              ) : (
                <Button
                  variant="outline"
                  className="w-fit"
                  disabled={!allSorted || readOnly}
                  onClick={() => patch({ showCheck: true })}
                >
                  <CheckCheck />
                  Check my sorting
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground text-sm">
                Drag the frames into chronological order on the light table, from free-living prokaryote to modern
                organelle, and jot a quick prediction on each one.
              </p>
              <DndContext sensors={sensors} onDragEnd={handleTimelineDragEnd}>
                <SortableContext items={timelineOrder} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-3 rounded-md bg-[color-mix(in_oklch,var(--foreground)_6%,var(--background))] p-3">
                    {timelineOrder.map((stageId, index) => (
                      <SlideFrame
                        key={stageId}
                        stage={TIMELINE_STAGES[stageId]}
                        index={index}
                        note={stageNotes[stageId] ?? ""}
                        readOnly={readOnly}
                        correct={gradingView ? stageId === STAGE_ORDER[index] : undefined}
                        onNoteChange={(value) => patch({ stageNotes: { ...stageNotes, [stageId]: value } })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {gradingView ? (
                <p className="text-sm font-medium">
                  {correctTimelineCount} of {STAGE_ORDER.length} stages in the correct position.
                </p>
              ) : (
                timelineCorrect && (
                  <p className="text-success flex items-center gap-1.5 text-sm">
                    <CheckCheck className="size-4" />
                    That&apos;s the correct chronological order.
                  </p>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
