"use client";

import { ArrowLeft, GraduationCap, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay } from "@/lib/format";
import { trpc } from "@/lib/trpc";

const STATUS: Record<string, { label: string; dot: string }> = {
  NEW: { label: "New", dot: "bg-muted-foreground/40" },
  LEARNING: { label: "Learning", dot: "bg-warn" },
  LEARNED: { label: "Learned", dot: "bg-good" },
};

export function DayDetail({ date }: { date: string }) {
  const words = trpc.words.byDate.useQuery({ date });
  const utils = trpc.useUtils();
  const remove = trpc.words.remove.useMutation({
    onSuccess: () => utils.invalidate(),
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
            <Link href="/">
              <ArrowLeft /> Dashboard
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{formatDay(date)}</h1>
          <p className="mt-1 text-muted-foreground">
            {words.data
              ? `${words.data.length} ${words.data.length === 1 ? "word" : "words"}`
              : "…"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/study/${date}`}>
            <GraduationCap /> Study this deck
          </Link>
        </Button>
      </section>

      {words.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {words.error && (
        <p className="text-sm text-destructive">Failed to load: {words.error.message}</p>
      )}

      {words.data && words.data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No words on this day.
          </CardContent>
        </Card>
      )}

      {words.data && words.data.length > 0 && (
        <Card className="overflow-hidden py-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>German</TableHead>
                  <TableHead>English</TableHead>
                  <TableHead>Example</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.data.map((w) => {
                  const status = STATUS[w.status] ?? STATUS.NEW;
                  return (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1">
                          {w.german}
                          <CopyButton text={w.german} label="Copy German word" compact />
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          {w.english}
                          <CopyButton text={w.english} label="Copy English word" compact />
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs text-muted-foreground">
                        {w.exampleGerman && (
                          <div className="flex items-center gap-1">
                            <p className="min-w-0 flex-1 truncate italic" title={w.exampleGerman}>
                              {w.exampleGerman}
                            </p>
                            <CopyButton
                              text={w.exampleGerman}
                              label="Copy German example"
                              compact
                            />
                          </div>
                        )}
                        {w.exampleEnglish && (
                          <div className="flex items-center gap-1">
                            <p className="min-w-0 flex-1 truncate" title={w.exampleEnglish}>
                              {w.exampleEnglish}
                            </p>
                            <CopyButton
                              text={w.exampleEnglish}
                              label="Copy English example"
                              compact
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <span className={`size-2 rounded-full ${status.dot}`} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {w.correct}✓ {w.incorrect}✗
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Delete "${w.german}"?`)) remove.mutate({ id: w.id });
                          }}
                        >
                          <Trash2 />
                          <span className="sr-only">Delete {w.german}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
