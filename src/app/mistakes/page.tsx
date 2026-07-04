"use client";

import {
  ArrowRight,
  CalendarClock,
  GraduationCap,
  History,
  Keyboard,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "@/server/routers/_app";

const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
const dateTime = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default function MistakesPage() {
  const range = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    return { yesterdayStart, todayStart };
  }, []);
  const overview = trpc.mistakes.overview.useQuery(range);
  const data = overview.data;
  const activeMistakes = data?.recurring.filter((word) => word.status !== "LEARNED") ?? [];
  const yesterdayUrl = `/study/mistakes?from=${encodeURIComponent(
    range.yesterdayStart.toISOString(),
  )}&to=${encodeURIComponent(range.todayStart.toISOString())}`;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mistakes</h1>
          <p className="mt-1 text-muted-foreground">
            Revisit missed words by day, frequency, or study session.
          </p>
        </div>
        {activeMistakes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/study/mistakes">
                <GraduationCap /> Practice as flashcards
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/study/mistakes?mode=type">
                <Keyboard /> Practice by typing
              </Link>
            </Button>
          </div>
        )}
      </section>

      {overview.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {overview.error && (
        <p className="text-sm text-destructive">Failed to load: {overview.error.message}</p>
      )}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Summary label="Words missed" value={data.recurring.length} />
            <Summary label="Missed yesterday" value={data.yesterday.length} />
            <Summary label="Recent sessions" value={data.sessions.length} />
          </section>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="size-4" /> Yesterday
                </CardTitle>
                <CardDescription>Misses from the previous calendar day.</CardDescription>
              </div>
              {data.yesterday.length > 0 && (
                <Button size="sm" asChild>
                  <Link href={yesterdayUrl}>
                    Revisit <ArrowRight />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {data.yesterday.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mistakes recorded yesterday.</p>
              ) : (
                <ul className="divide-y">
                  {data.yesterday.map((word) => (
                    <li key={word.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{word.german}</span>
                        <span className="ml-3 text-sm text-muted-foreground">{word.english}</span>
                        {word.lastAnswer && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            You typed: <span className="line-through">{word.lastAnswer}</span>
                            {word.lastMistakeKind === "ARTICLE" && " · article mistake"}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive">
                        {word.misses} {word.misses === 1 ? "miss" : "misses"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden py-0">
            <CardHeader className="pt-6">
              <CardTitle>Frequently missed words</CardTitle>
              <CardDescription>
                Ranked by total misses. Learned words stay visible as history.
              </CardDescription>
            </CardHeader>
            {data.recurring.length === 0 ? (
              <CardContent className="flex flex-col items-center pb-10 text-center">
                <PartyPopper className="size-5 text-muted-foreground" />
                <p className="mt-3 font-semibold">No mistakes recorded yet</p>
              </CardContent>
            ) : (
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>German</TableHead>
                      <TableHead>English</TableHead>
                      <TableHead>Missed</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last missed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recurring.map((word) => (
                      <TableRow key={word.id}>
                        <TableCell className="font-medium">
                          {word.german}
                          {word.lastAnswer && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              Last answer: <span className="line-through">{word.lastAnswer}</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{word.english}</TableCell>
                        <TableCell className="font-medium text-destructive tabular-nums">
                          {word.incorrect}×
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {word.correct}×
                        </TableCell>
                        <TableCell>
                          <Badge variant={word.status === "LEARNED" ? "secondary" : "destructive"}>
                            {word.status === "LEARNED" ? "Learned" : "Needs work"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {word.lastMissedAt ? shortDate.format(word.lastMissedAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>

          <section className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <History className="size-4" /> Recent sessions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Session grouping starts with reviews made after this update.
              </p>
            </div>
            {data.sessions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Complete a study session to see it here.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

type Session = inferRouterOutputs<AppRouter>["mistakes"]["overview"]["sessions"][number];

function SessionCard({ session }: { session: Session }) {
  const accuracy = Math.round((session.correct / session.total) * 100);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{dateTime.format(session.startedAt)}</CardTitle>
            <CardDescription>
              {deckLabel(session.deck)} · {session.correct}/{session.total} correct · {accuracy}%
            </CardDescription>
          </div>
          <Badge variant={session.mistakes.length > 0 ? "destructive" : "secondary"}>
            {session.mistakes.length} missed
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {session.mistakes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mistakes in this session.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {session.mistakes.slice(0, 6).map((word) => (
                <Badge key={word.id} variant="outline">
                  {word.german}
                </Badge>
              ))}
              {session.mistakes.length > 6 && (
                <Badge variant="outline">+{session.mistakes.length - 6}</Badge>
              )}
            </div>
            <Button size="sm" variant="outline" className="mt-4" asChild>
              <Link href={`/study/mistakes?session=${session.id}`}>
                Revisit this session <ArrowRight />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function deckLabel(deck: string) {
  if (deck === "all") return "All words";
  if (deck === "practice") return "Needs practice";
  if (deck === "mistakes") return "Mistake review";
  return deck;
}
