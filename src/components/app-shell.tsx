"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpenText, TrainFront } from "lucide-react";
import type { PanelImperativeHandle } from "react-resizable-panels";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { RulesContent } from "@/components/rules-panel";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/study", label: "Study" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/upload", label: "Upload" },
];

// Size the rules panel opens to (as a % of the split).
const OPEN_SIZE = "42%";

export function AppShell({ children }: { children: React.ReactNode }) {
  const rulesPanel = React.useRef<PanelImperativeHandle>(null);
  const [open, setOpen] = React.useState(false);

  // Start with the rules panel collapsed.
  React.useEffect(() => {
    rulesPanel.current?.collapse();
  }, []);

  const openRules = React.useCallback(() => {
    rulesPanel.current?.resize(OPEN_SIZE);
  }, []);

  const closeRules = React.useCallback(() => {
    rulesPanel.current?.collapse();
  }, []);

  const toggleRules = React.useCallback(() => {
    const panel = rulesPanel.current;
    if (!panel) return;
    if (panel.isCollapsed()) openRules();
    else closeRules();
  }, [openRules, closeRules]);

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-50 shrink-0 border-b bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrainFront className="size-4" />
            </span>
            Deutsche Express
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {NAV.map((item) => (
              <Button key={item.href} variant="ghost" size="sm" asChild>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <Button
              variant={open ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleRules}
              aria-pressed={open}
            >
              <BookOpenText />
              Rules
            </Button>
          </div>
        </nav>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Left — the normal app */}
        <ResizablePanel minSize="30%" className="overflow-y-auto">
          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        </ResizablePanel>

        {open && <ResizableHandle withHandle />}

        {/* Right — the rules reference; collapses to zero */}
        <ResizablePanel
          panelRef={rulesPanel}
          collapsible
          collapsedSize="0%"
          defaultSize="0%"
          minSize="24%"
          onResize={(size) => setOpen(size.asPercentage > 0)}
          className="border-l"
        >
          <RulesContent onClose={closeRules} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
