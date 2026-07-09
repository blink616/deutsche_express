"use client";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FolderOpen,
  GraduationCap,
  Layers,
  Target,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DownloadWordsButton } from "@/components/download-words-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDay, localToday } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export default function DashboardPage() {
  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const overview = trpc.stats.overview.useQuery({ startOfToday });
  const groups = trpc.words.groups.useQuery();

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Your German vocabulary at a glance.</p>
        </div>
        {overview.data !== undefined && overview.data.totalWords > 0 && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/study/all">
                <GraduationCap /> Study all
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/study/practice">
                <Target /> Practice unlearned
              </Link>
            </Button>
            <DownloadWordsButton />
            {overview.data.mistakes > 0 && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                asChild
              >
                <Link href="/mistakes">
                  <CircleAlert /> Mistakes ({overview.data.mistakes})
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Words"
          value={overview.data?.totalWords}
          icon={<Layers className="size-4" />}
        />
        <StatTile
          label="Learned"
          value={overview.data?.learned}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatTile
          label="Reviews today"
          value={overview.data?.reviewsToday}
          icon={<Activity className="size-4" />}
        />
        <StatTile
          label="Accuracy"
          value={
            overview.data === undefined
              ? undefined
              : overview.data.accuracy === null
                ? "—"
                : `${overview.data.accuracy}%`
          }
          icon={<Target className="size-4" />}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Words by day</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <LegendDot color="bg-good" label="Learned" />
            <LegendDot color="bg-warn" label="Learning" />
            <LegendDot color="bg-muted-foreground/30" label="New" />
          </div>
        </div>

        {groups.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {groups.error && (
          <p className="text-sm text-destructive">Failed to load: {groups.error.message}</p>
        )}
        {groups.data?.length === 0 && <EmptyState />}
        <div className="grid gap-4 md:grid-cols-2">
          {groups.data?.map((g) => (
            <DayGroupCard key={g.date} group={g} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string | undefined;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-sm font-medium">{label}</span>
          {icon}
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight">{value ?? "…"}</div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function DayGroupCard({
  group,
}: {
  group: { date: string; total: number; learned: number; learning: number; fresh: number };
}) {
  const pct = (n: number) => (group.total === 0 ? 0 : (n / group.total) * 100);
  const isToday = group.date === localToday();
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">
              {formatDay(group.date)}
              {isToday && (
                <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  Today
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.total} {group.total === 1 ? "word" : "words"} · {group.learned} learned ·{" "}
              {group.learning} learning · {group.fresh} new
            </p>
          </div>
        </div>
        <div
          className="mt-4 flex h-2 gap-0.5"
          role="img"
          aria-label={`${group.learned} of ${group.total} words learned`}
        >
          {group.learned > 0 && (
            <div className="rounded-full bg-good" style={{ width: `${pct(group.learned)}%` }} />
          )}
          {group.learning > 0 && (
            <div className="rounded-full bg-warn" style={{ width: `${pct(group.learning)}%` }} />
          )}
          {group.fresh > 0 && (
            <div
              className="rounded-full bg-muted-foreground/30"
              style={{ width: `${pct(group.fresh)}%` }}
            />
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" asChild>
            <Link href={`/study/${group.date}`}>
              Study <ArrowRight />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/day/${group.date}`}>
              <FolderOpen /> Browse
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <Upload className="size-5 text-muted-foreground" />
        </span>
        <p className="mt-4 font-semibold">No words yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV or comma-separated list to build your first deck.
        </p>
        <Button className="mt-5" asChild>
          <Link href="/upload">
            <Upload /> Upload words
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
