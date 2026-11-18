import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProblemTable, type ProblemTableRow } from "@/components/ProblemTable";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { ALL_PLACEMENTS, PROBLEM_MAP } from "@/data/problems";
import { useProgress } from "@/lib/progress-store";
import { useGlobalSearch } from "@/lib/search-context";

export const Route = createFileRoute("/revision")({
  head: () => ({
    meta: [
      { title: "Revision — DSA Sheet" },
      { name: "description", content: "Problems flagged for revision." },
      { property: "og:title", content: "Revision — DSA Sheet" },
      { property: "og:description", content: "Problems flagged for revision." },
    ],
  }),
  component: RevisionPage,
});

function RevisionPage() {
  const progress = useProgress();
  const { query, setQuery } = useGlobalSearch();
  const q = query.trim().toLowerCase();

  const ids = new Set<string>();
  const rows: ProblemTableRow[] = [];
  let totalRevisionCount = 0;

  for (const pl of ALL_PLACEMENTS) {
    if (ids.has(pl.problemId)) continue;
    if (!progress[pl.problemId]?.needsRevision) continue;
    const pr = PROBLEM_MAP[pl.problemId];
    if (!pr) continue;
    ids.add(pl.problemId);
    totalRevisionCount++;
    if (q && !pr.title.toLowerCase().includes(q) && !pl.topicName.toLowerCase().includes(q))
      continue;
    rows.push({ problem: pr, pattern: `${pl.topicName} • ${pl.levelTitle}` });
  }

  return (
    <AppShell title="Revision">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Needs Revision</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Problems you've marked to revisit. Click the revision icon on any row to add or remove it.
          </p>
        </div>
        {q && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear search
          </Button>
        )}
      </div>
      {rows.length === 0 ? (
        totalRevisionCount > 0 && q ? (
          <EmptyState
            title="No revision problems match your search"
            description={`No revision problems match "${query}".`}
            action={
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No revision problems"
            description="You're caught up with your revision list."
          />
        )
      ) : (
        <ProblemTable rows={rows} />
      )}
    </AppShell>
  );
}
