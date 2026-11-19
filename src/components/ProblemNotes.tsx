import { useEffect, useRef, useState } from "react";
import { StickyNote } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getEntry, hasNotes, progressRepo, useProgressEntry } from "@/lib/progress-store";

const SAVE_DELAY_MS = 500;
const MAX_LENGTH = 2000;

// Editor body shared by the desktop popover and the mobile sheet.
// Keeps a local draft and saves it after a short pause in typing, and
// once more on unmount (panel closed) so the last keystrokes aren't lost.
function NotesEditor({ problemId, autoFocus }: { problemId: string; autoFocus?: boolean }) {
  const saved = useProgressEntry(problemId).notes ?? "";
  const [draft, setDraft] = useState(saved);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (draft === saved) return;
    const t = setTimeout(() => progressRepo.setNotes(problemId, draft), SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [draft, saved, problemId]);

  useEffect(() => {
    return () => {
      // Flush pending edits when the panel closes.
      if ((getEntry(problemId).notes ?? "") !== draftRef.current) {
        progressRepo.setNotes(problemId, draftRef.current);
      }
    };
  }, [problemId]);

  return (
    <div className="space-y-1.5">
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_LENGTH}
        autoFocus={autoFocus}
        rows={6}
        placeholder="Key idea, edge cases, complexity…"
        aria-label="Notes"
        className="resize-y text-sm"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{draft === saved ? "Saved" : "Saving…"}</span>
        <span>
          {draft.length} / {MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}

export function ProblemNotes({
  problemId,
  problemTitle,
  variant,
}: {
  problemId: string;
  problemTitle: string;
  variant: "desktop" | "mobile";
}) {
  const notes = useProgressEntry(problemId).notes;
  const active = hasNotes(notes);
  const [open, setOpen] = useState(false);

  const label = active ? `Edit notes for ${problemTitle}` : `Add notes for ${problemTitle}`;

  if (variant === "mobile") {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button aria-label={label}>
            <StickyNote
              className={`h-4 w-4 ${active ? "fill-primary/20 text-primary" : "text-muted-foreground"}`}
            />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-lg">
          <SheetHeader>
            <SheetTitle className="truncate">{problemTitle}</SheetTitle>
            <SheetDescription>Your notes are saved automatically.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">{open && <NotesEditor problemId={problemId} />}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={label}
          className={`opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 ${
            active ? "opacity-100" : ""
          }`}
        >
          <StickyNote
            className={`h-3.5 w-3.5 ${
              active
                ? "fill-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="mb-2 truncate text-sm font-medium">{problemTitle}</p>
        {open && <NotesEditor problemId={problemId} autoFocus />}
      </PopoverContent>
    </Popover>
  );
}
