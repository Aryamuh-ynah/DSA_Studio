import { useEffect, useRef, useState } from "react";
import { Moon, Search, Sun, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useGlobalSearch } from "@/lib/search-context";

export function AppHeader({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  const { query, setQuery } = useGlobalSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  // Detected after mount so the server render and first client render match.
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setQuery]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground" />
      <div className="hidden min-w-0 flex-1 items-center md:flex">
        <h1 className="truncate text-sm font-semibold text-foreground">
          {title}
        </h1>
      </div>
      <div className="relative ml-auto w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search problems, topics, patterns…"
          className={`h-9 border-border bg-surface pl-8 pr-8 text-sm ${query ? "" : "md:pr-16"}`}
          aria-label="Search problems and topics"
          aria-keyshortcuts={isMac ? "Meta+K /" : "Control+K /"}
        />
        {!query && (
          // Shortcut hint: keyboard users only, so hidden on small (touch) screens.
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground md:inline-flex">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        )}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear search query"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="h-9 w-9 text-muted-foreground"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
