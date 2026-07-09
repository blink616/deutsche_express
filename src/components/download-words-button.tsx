"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localToday } from "@/lib/format";
import { trpc } from "@/lib/trpc";

type ExportWord = {
  german: string;
  english: string;
  exampleGerman: string | null;
  exampleEnglish: string | null;
  addedOn: Date;
  status: string;
  correct: number;
  incorrect: number;
  streak: number;
  lastReviewedAt: Date | null;
};

const CSV_HEADERS = [
  "german",
  "english",
  "german_example",
  "english_example",
  "added_on",
  "status",
  "correct",
  "incorrect",
  "streak",
  "last_reviewed_at",
];

function csvField(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value: Date | null, mode: "date" | "datetime"): string | null {
  if (!value) return null;
  const iso = value.toISOString();
  return mode === "date" ? iso.slice(0, 10) : iso;
}

function wordsToCsv(words: ExportWord[]): string {
  const rows = words.map((word) => [
    word.german,
    word.english,
    word.exampleGerman,
    word.exampleEnglish,
    formatDate(word.addedOn, "date"),
    word.status,
    word.correct,
    word.incorrect,
    word.streak,
    formatDate(word.lastReviewedAt, "datetime"),
  ]);

  return [CSV_HEADERS, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `deutsche-express-words-${localToday()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DownloadWordsButton({ disabled = false }: { disabled?: boolean }) {
  const words = trpc.words.exportAll.useQuery(undefined, { enabled: false });

  async function onDownload() {
    const result = await words.refetch();
    if (!result.data || result.data.length === 0) return;
    downloadCsv(wordsToCsv(result.data));
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onDownload}
      disabled={disabled || words.isFetching}
    >
      <Download /> {words.isFetching ? "Preparing..." : "Download CSV"}
    </Button>
  );
}
