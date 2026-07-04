"use client";

import { ArrowRight, CalendarIcon, GraduationCap, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay, toLocalYMD } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export default function StudyIndexPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const groups = trpc.words.groups.useQuery();

  const wordDates = new Set(groups.data?.map((g) => g.date));
  const selectedYMD = date ? toLocalYMD(date) : undefined;
  const selected = groups.data?.find((g) => g.date === selectedYMD);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Study</h1>
        <p className="mt-1 text-muted-foreground">Pick a deck to practice.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/study/all" className="group">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-4" /> All words
              </CardTitle>
              <CardDescription>Everything you&apos;ve uploaded, shuffled.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/study/practice" className="group">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4" /> Needs practice
              </CardTitle>
              <CardDescription>Only words you haven&apos;t learned yet.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Study a specific day</CardTitle>
          <CardDescription>
            Pick a date to review just the words you added that day. Days without words are
            disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-56 justify-start font-normal">
                <CalendarIcon className="text-muted-foreground" />
                {date ? formatDay(toLocalYMD(date)) : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setOpen(false);
                }}
                disabled={(d) => !wordDates.has(toLocalYMD(d))}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={() => selectedYMD && router.push(`/study/${selectedYMD}`)}
            disabled={!selected}
          >
            Study this day <ArrowRight />
          </Button>
          {selected && (
            <span className="text-sm text-muted-foreground">
              {selected.total} {selected.total === 1 ? "word" : "words"} · {selected.learned}{" "}
              learned
            </span>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Days with words</h2>
        {groups.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {groups.error && (
          <p className="text-sm text-destructive">Failed to load: {groups.error.message}</p>
        )}
        {groups.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing yet —{" "}
            <Link href="/upload" className="font-medium text-foreground underline underline-offset-4">
              upload your first words
            </Link>
            .
          </p>
        )}
        {groups.data?.map((g) => (
          <Card key={g.date}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <span className="font-medium">{formatDay(g.date)}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {g.total} {g.total === 1 ? "word" : "words"} · {g.learned} learned
                </span>
              </div>
              <Button size="sm" asChild>
                <Link href={`/study/${g.date}`}>
                  Study <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
