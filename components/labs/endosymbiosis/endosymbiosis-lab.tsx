"use client";

import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SortZone } from "./sort-zone";
import { TimelineStageCard } from "./timeline-stage-card";
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

export function EndosymbiosisLab({ simState, onSimStateChange, readOnly }: LabComponentProps) {
  const state = simState as Partial<EndosymbiosisSimState>;
  const sorting = state.sorting ?? defaultSorting();
  const showCheck = state.showCheck ?? false;
  const timelineOrder = state.timelineOrder ?? INITIAL_SHUFFLED_STAGE_ORDER;
  const stageNotes = state.stageNotes ?? {};

  const [activeTab, setActiveTab] = useState<"sort" | "timeline">("sort");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function patch(next: Partial<EndosymbiosisSimState>) {
    onSimStateChange({ sorting, showCheck, timelineOrder, stageNotes, ...next });
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Button variant={activeTab === "sort" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("sort")}>
          1. Sort the evidence
        </Button>
        <Button variant={activeTab === "timeline" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("timeline")}>
          2. Build the timeline
        </Button>
      </div>

      {activeTab === "sort" && (
        <Card>
          <CardHeader>
            <CardTitle>Sort the evidence</CardTitle>
            <CardDescription>
              Drag each card into the bin where it belongs, then expand a card to read the supporting data. Click
              &quot;Check my sorting&quot; once every card is placed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-6">
            <DndContext sensors={sensors} onDragEnd={handleSortDragEnd}>
              <SortZone id="unsorted" title="Unsorted evidence" cards={unsorted} readOnly={readOnly} showCheck={false} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SortZone
                  id="supports"
                  title="Supports endosymbiotic theory"
                  cards={supports}
                  readOnly={readOnly}
                  showCheck={showCheck}
                />
                <SortZone
                  id="doesnt_support"
                  title="Doesn't support it"
                  cards={doesntSupport}
                  readOnly={readOnly}
                  showCheck={showCheck}
                />
              </div>
            </DndContext>
            <Button
              variant="outline"
              className="w-fit"
              disabled={!allSorted || readOnly}
              onClick={() => patch({ showCheck: true })}
            >
              <CheckCheck />
              Check my sorting
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "timeline" && (
        <Card>
          <CardHeader>
            <CardTitle>Build the evolutionary timeline</CardTitle>
            <CardDescription>
              Drag the stages into chronological order, from free-living prokaryote to modern organelle, and jot a
              quick prediction at each one.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-6">
            <DndContext sensors={sensors} onDragEnd={handleTimelineDragEnd}>
              <SortableContext items={timelineOrder} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {timelineOrder.map((stageId, index) => (
                    <TimelineStageCard
                      key={stageId}
                      stage={TIMELINE_STAGES[stageId]}
                      index={index}
                      note={stageNotes[stageId] ?? ""}
                      readOnly={readOnly}
                      onNoteChange={(value) => patch({ stageNotes: { ...stageNotes, [stageId]: value } })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {timelineCorrect && (
              <p className="text-success flex items-center gap-1.5 text-sm">
                <CheckCheck className="size-4" />
                That&apos;s the correct chronological order.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
