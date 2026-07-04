"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderOpen,
  Keyboard,
  Layers,
  PartyPopper,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatDay } from "@/lib/format";
import { trpc } from "@/lib/trpc";

type Result = { wordId: number; correct: boolean };
type Mode = "flip" | "type";
type Checked = { correct: boolean; articleHint: boolean; revealed: boolean };

const ARTICLES = ["der", "die", "das", "ein", "eine"];

/** Lowercase, collapse spaces, and fold umlauts (ä→ae, ß→ss …) so
 *  keyboards without German layout aren't penalized. */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replaceAll("ß", "ss")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue");
}

function stripArticle(s: string): string {
  const parts = s.split(" ");
  return parts.length > 1 && ARTICLES.includes(parts[0]) ? parts.slice(1).join(" ") : s;
}

function gradeAnswer(input: string, expected: string): { correct: boolean; articleHint: boolean } {
  const a = normalize(input);
  const b = normalize(expected);
  if (a === b) return { correct: true, articleHint: false };
  if (stripArticle(a) === stripArticle(b)) return { correct: false, articleHint: true };
  return { correct: false, articleHint: false };
}

function deckTitle(deck: string): string {
  if (deck === "all") return "All words";
  if (deck === "practice") return "Needs practice";
  if (deck === "mistakes") return "Mistake review";
  if (/^\d{4}-\d{2}-\d{2}$/.test(deck)) return formatDay(deck);
  return deck;
}

export function StudySession({
  deck,
  initialMode = "flip",
  mistakeFilter,
}: {
  deck: string;
  initialMode?: Mode;
  mistakeFilter?: { from?: Date; to?: Date; sessionId?: string };
}) {
  const utils = trpc.useUtils();
  const deckQuery = trpc.study.deck.useQuery(
    { deck, ...mistakeFilter },
    { refetchOnWindowFocus: false, refetchOnReconnect: false, staleTime: Infinity },
  );
  const review = trpc.study.review.useMutation();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState<Checked | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [reviewingHistory, setReviewingHistory] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const inputRef = useRef<HTMLInputElement>(null);

  const cards = deckQuery.data;
  const card = cards?.[index];
  const done = !!cards && cards.length > 0 && index >= cards.length;
  const revisiting = reviewingHistory;
  const previousResult = revisiting ? results[index] : undefined;

  async function record(
    correct: boolean,
    details?: {
      submittedAnswer?: string;
      mistakeKind?: "SELF_REPORTED" | "INCORRECT_ANSWER" | "ARTICLE" | "REVEALED";
    },
  ) {
    if (!card) return false;
    try {
      await review.mutateAsync({ wordId: card.id, correct, sessionId, deck, mode, ...details });
    } catch {
      return false;
    }
    setResults((r) => [...r, { wordId: card.id, correct }]);
    return true;
  }

  function advance() {
    if (!cards) return;
    setFlipped(false);
    setTyped("");
    setChecked(null);
    setReviewingHistory(false);
    const next = index + 1;
    setIndex(next);
    if (next >= cards.length) {
      utils.stats.invalidate();
      utils.words.invalidate();
      utils.mistakes.invalidate();
    }
  }

  function goBack() {
    if (index === 0 || review.isPending) return;
    setIndex((current) => current - 1);
    setReviewingHistory(true);
    setFlipped(false);
    setTyped("");
    setChecked(null);
  }

  function goForward() {
    if (!revisiting || review.isPending) return;
    const next = index + 1;
    setIndex(next);
    setReviewingHistory(next < results.length);
    setFlipped(false);
    setTyped("");
    setChecked(null);
  }

  async function answer(correct: boolean) {
    if (await record(correct, correct ? undefined : { mistakeKind: "SELF_REPORTED" })) {
      advance();
    }
  }

  async function check() {
    if (!card || typed.trim() === "") return;
    const grade = gradeAnswer(typed, card.german);
    const recorded = await record(grade.correct, {
      submittedAnswer: typed.trim(),
      mistakeKind: grade.correct
        ? undefined
        : grade.articleHint
          ? "ARTICLE"
          : "INCORRECT_ANSWER",
    });
    if (recorded) setChecked({ ...grade, revealed: false });
  }

  async function reveal() {
    if (await record(false, { mistakeKind: "REVEALED" })) {
      setChecked({ correct: false, articleHint: false, revealed: true });
    }
  }

  async function restart() {
    setIndex(0);
    setFlipped(false);
    setTyped("");
    setChecked(null);
    setResults([]);
    setReviewingHistory(false);
    setSessionId(crypto.randomUUID());
    review.reset();
    await deckQuery.refetch();
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    // reset any half-answered card so the two modes can't double-record
    if (checked === null) {
      setMode(next);
      setFlipped(false);
      setTyped("");
    }
  }

  function insertChar(ch: string) {
    const el = inputRef.current;
    if (!el || checked !== null) return;
    const start = el.selectionStart ?? typed.length;
    const end = el.selectionEnd ?? typed.length;
    setTyped(typed.slice(0, start) + ch + typed.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  }

  useEffect(() => {
    if (mode === "type" && checked === null && !done && !revisiting) {
      inputRef.current?.focus();
    }
  }, [mode, index, checked, done, revisiting, cards]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || !card || review.isPending) return;
      if (revisiting) {
        if (["ArrowLeft", "ArrowRight", "Enter", " "].includes(e.key)) {
          e.preventDefault();
        }
        if (e.key === "ArrowLeft") goBack();
        else if (e.key === "ArrowRight" || e.key === "Enter") goForward();
        else if (mode === "flip" && e.key === " ") setFlipped((value) => !value);
        return;
      }
      if (mode === "flip") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setFlipped((f) => !f);
        } else if (flipped && e.key === "ArrowLeft") {
          void answer(false);
        } else if (flipped && e.key === "ArrowRight") {
          void answer(true);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (checked === null) void check();
        else advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (deckQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Shuffling deck…</p>;
  }

  if (deckQuery.error) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-8 text-center">
          <p className="font-semibold text-destructive">Couldn&apos;t load this deck</p>
          <p className="mt-1 text-sm text-muted-foreground">{deckQuery.error.message}</p>
          <Button variant="outline" className="mt-5" asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <Card className="mx-auto max-w-lg border-dashed">
        <CardContent className="flex flex-col items-center p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            {deck === "practice" || deck === "mistakes" ? (
              <PartyPopper className="size-5 text-muted-foreground" />
            ) : (
              <FolderOpen className="size-5 text-muted-foreground" />
            )}
          </span>
          <p className="mt-4 font-semibold">
            {deck === "practice"
              ? "Nothing needs practice — everything is learned!"
              : deck === "mistakes"
                ? "No mistakes to practice — nice work!"
                : "This deck is empty"}
          </p>
          <div className="mt-5 flex gap-2">
            <Button asChild>
              <Link href="/upload">
                <Upload /> Upload words
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    const correctCount = results.filter((r) => r.correct).length;
    const missed = cards.filter((c) =>
      results.some((r) => r.wordId === c.id && !r.correct),
    );
    const accuracy = Math.round((correctCount / results.length) * 100);
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {deckTitle(deck)} — session complete
            </p>
            <p className="mt-3 text-6xl font-bold tracking-tight">{accuracy}%</p>
            <p className="mt-3 text-sm">
              <span className="font-medium text-good">
                <Check className="mr-1 inline size-4" />
                {correctCount} correct
              </span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="font-medium text-destructive">
                <X className="mr-1 inline size-4" />
                {missed.length} missed
              </span>
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={goBack}>
                <ChevronLeft /> Previous card
              </Button>
              <Button onClick={restart}>
                <RotateCcw /> Study again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {missed.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold">Worth another look</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {missed.map((w) => (
                  <li key={w.id} className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-medium">{w.german}</span>
                    <span className="text-muted-foreground">{w.english}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">{deckTitle(deck)}</span>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border bg-card p-0.5">
            <Button
              size="xs"
              variant={mode === "flip" ? "secondary" : "ghost"}
              onClick={() => switchMode("flip")}
            >
              <Layers /> Flashcards
            </Button>
            <Button
              size="xs"
              variant={mode === "type" ? "secondary" : "ghost"}
              onClick={() => switchMode("type")}
            >
              <Keyboard /> Type answer
            </Button>
          </div>
          <span className="text-muted-foreground tabular-nums">
            {index + 1} / {cards.length}
          </span>
        </div>
      </div>
      <Progress value={(index / cards.length) * 100} />
      {review.error && (
        <p className="text-sm text-destructive">
          Couldn&apos;t save that answer. Please try again: {review.error.message}
        </p>
      )}

      {mode === "flip" ? (
        <>
          <div className="flip-scene">
            <div
              className={`flip-card cursor-pointer ${flipped ? "flipped" : ""}`}
              onClick={() => setFlipped((f) => !f)}
            >
              <div className="flip-face flex min-h-80 flex-col items-center justify-center rounded-3xl border bg-card p-10 text-center shadow-sm">
                <div className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  German
                </div>
                <div className="mt-4 text-4xl font-bold tracking-tight">{card!.german}</div>
                <CopyButton text={card!.german} label="Copy word" className="mt-2" />
                {card!.exampleGerman && (
                  <div className="mt-5">
                    <p className="text-muted-foreground italic">{card!.exampleGerman}</p>
                    <CopyButton
                      text={card!.exampleGerman}
                      label="Copy example"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              <div className="flip-back flip-face flex flex-col items-center justify-center rounded-3xl border bg-card p-10 text-center shadow-sm">
                <div className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  English
                </div>
                <div className="mt-4 text-4xl font-bold tracking-tight">{card!.english}</div>
                <CopyButton text={card!.english} label="Copy word" className="mt-2" />
                {card!.exampleEnglish && (
                  <div className="mt-5">
                    <p className="text-muted-foreground italic">{card!.exampleEnglish}</p>
                    <CopyButton
                      text={card!.exampleEnglish}
                      label="Copy example"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {!flipped ? (
            <div className={index > 0 ? "grid grid-cols-2 gap-3" : ""}>
              {index > 0 && (
                <Button size="lg" variant="outline" onClick={goBack}>
                  <ChevronLeft /> Previous card
                </Button>
              )}
              <Button size="lg" className="w-full" onClick={() => setFlipped(true)}>
                Show answer <span className="text-primary-foreground/60">(space)</span>
              </Button>
            </div>
          ) : revisiting ? (
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" variant="outline" onClick={goBack} disabled={index === 0}>
                <ChevronLeft /> Previous card
              </Button>
              <Button size="lg" onClick={goForward}>
                Next card <ChevronRight />
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => void answer(false)}
                  disabled={review.isPending}
                >
                  <X /> Missed it <span className="opacity-60">(←)</span>
                </Button>
                <Button
                  size="lg"
                  className="bg-good text-white hover:bg-good/90"
                  onClick={() => void answer(true)}
                  disabled={review.isPending}
                >
                  <Check /> Got it <span className="text-white/70">(→)</span>
                </Button>
              </div>
              {index > 0 && (
                <Button size="lg" variant="outline" className="mt-3 w-full" onClick={goBack}>
                  <ChevronLeft /> Previous card
                </Button>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="flex min-h-80 flex-col items-center justify-center p-10 text-center">
              <div className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                English
              </div>
              <div className="mt-4 text-4xl font-bold tracking-tight">{card!.english}</div>
              <CopyButton text={card!.english} label="Copy word" className="mt-2" />
              {card!.exampleEnglish && (
                <div className="mt-4">
                  <p className="text-muted-foreground italic">{card!.exampleEnglish}</p>
                  <CopyButton
                    text={card!.exampleEnglish}
                    label="Copy example"
                    className="mt-1"
                  />
                </div>
              )}

              {revisiting ? (
                <div className="mt-8 w-full max-w-sm">
                  <p
                    className={
                      previousResult?.correct
                        ? "font-semibold text-good"
                        : "font-semibold text-destructive"
                    }
                  >
                    {previousResult?.correct ? (
                      <><Check className="mr-1 inline size-4" /> Previously correct</>
                    ) : (
                      <><X className="mr-1 inline size-4" /> Previously missed</>
                    )}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight">{card!.german}</p>
                  <CopyButton text={card!.german} label="Copy word" className="mt-2" />
                  {card!.exampleGerman && (
                    <div className="mt-3">
                      <p className="text-muted-foreground italic">{card!.exampleGerman}</p>
                      <CopyButton
                        text={card!.exampleGerman}
                        label="Copy example"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              ) : checked === null ? (
                <div className="mt-8 w-full max-w-sm space-y-3">
                  <Input
                    ref={inputRef}
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="Type the German word…"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="h-11 text-center text-lg"
                  />
                  <div className="flex justify-center gap-1.5">
                    {["ä", "ö", "ü", "ß"].map((ch) => (
                      <Button
                        key={ch}
                        size="icon-sm"
                        variant="outline"
                        tabIndex={-1}
                        onClick={() => insertChar(ch)}
                      >
                        {ch}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8 w-full max-w-sm">
                  {checked.correct ? (
                    <p className="font-semibold text-good">
                      <Check className="mr-1 inline size-4" /> Richtig!
                    </p>
                  ) : checked.revealed ? (
                    <p className="font-semibold text-muted-foreground">
                      <Eye className="mr-1 inline size-4" /> Here&apos;s the answer
                    </p>
                  ) : (
                    <p className="font-semibold text-destructive">
                      <X className="mr-1 inline size-4" />
                      {checked.articleHint ? "So close — watch the article!" : "Not quite"}
                    </p>
                  )}
                  {!checked.correct && !checked.revealed && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      You typed: <span className="line-through">{typed}</span>
                    </p>
                  )}
                  <p className="mt-3 text-3xl font-bold tracking-tight">{card!.german}</p>
                  <CopyButton text={card!.german} label="Copy word" className="mt-2" />
                  {card!.exampleGerman && (
                    <div className="mt-3">
                      <p className="text-muted-foreground italic">{card!.exampleGerman}</p>
                      <CopyButton
                        text={card!.exampleGerman}
                        label="Copy example"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {revisiting ? (
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" variant="outline" onClick={goBack} disabled={index === 0}>
                <ChevronLeft /> Previous card
              </Button>
              <Button size="lg" onClick={goForward}>
                Next card <ChevronRight />
              </Button>
            </div>
          ) : checked === null ? (
            <>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={check}
                  disabled={typed.trim() === "" || review.isPending}
                >
                  Check answer <span className="text-primary-foreground/60">(enter)</span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => void reveal()}
                  disabled={review.isPending}
                >
                  <Eye /> I don&apos;t know
                </Button>
              </div>
              {index > 0 && (
                <Button size="lg" variant="outline" className="mt-3 w-full" onClick={goBack}>
                  <ChevronLeft /> Previous card
                </Button>
              )}
            </>
          ) : (
            <div className={index > 0 ? "grid grid-cols-2 gap-3" : ""}>
              {index > 0 && (
                <Button size="lg" variant="outline" onClick={goBack}>
                  <ChevronLeft /> Previous card
                </Button>
              )}
              <Button size="lg" className="w-full" onClick={advance}>
                Next card <span className="text-primary-foreground/60">(enter)</span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
