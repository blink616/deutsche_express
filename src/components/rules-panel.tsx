"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// TAB 1 — Verben im Präsens
// ---------------------------------------------------------------------------

const VERBS = [
  "heißen",
  "kommen",
  "wohnen",
  "studieren",
  "arbeiten",
  "sprechen",
  "sein",
] as const;

type Cell = { form: string; special?: boolean };

const CONJUGATION: { pronoun: string; cells: Cell[] }[] = [
  {
    pronoun: "ich",
    cells: [
      { form: "heiße" },
      { form: "komme" },
      { form: "wohne" },
      { form: "studiere" },
      { form: "arbeite" },
      { form: "spreche" },
      { form: "bin", special: true },
    ],
  },
  {
    pronoun: "du",
    cells: [
      { form: "heißt", special: true },
      { form: "kommst" },
      { form: "wohnst" },
      { form: "studierst" },
      { form: "arbeitest", special: true },
      { form: "sprichst", special: true },
      { form: "bist", special: true },
    ],
  },
  {
    pronoun: "er/sie/es",
    cells: [
      { form: "heißt" },
      { form: "kommt" },
      { form: "wohnt" },
      { form: "studiert" },
      { form: "arbeitet", special: true },
      { form: "spricht", special: true },
      { form: "ist", special: true },
    ],
  },
  {
    pronoun: "wir",
    cells: [
      { form: "heißen" },
      { form: "kommen" },
      { form: "wohnen" },
      { form: "studieren" },
      { form: "arbeiten" },
      { form: "sprechen" },
      { form: "sind", special: true },
    ],
  },
  {
    pronoun: "ihr",
    cells: [
      { form: "heißt" },
      { form: "kommt" },
      { form: "wohnt" },
      { form: "studiert" },
      { form: "arbeitet", special: true },
      { form: "sprecht" },
      { form: "seid", special: true },
    ],
  },
  {
    pronoun: "sie/Sie",
    cells: [
      { form: "heißen" },
      { form: "kommen" },
      { form: "wohnen" },
      { form: "studieren" },
      { form: "arbeiten" },
      { form: "sprechen" },
      { form: "sind", special: true },
    ],
  },
];

function VerbsTab() {
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <Table className="text-[0.8rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-popover">Pronomen</TableHead>
              {VERBS.map((v) => (
                <TableHead key={v} className="text-center">
                  {v}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {CONJUGATION.map((row) => (
              <TableRow key={row.pronoun}>
                <TableCell className="sticky left-0 bg-popover font-medium text-muted-foreground">
                  {row.pronoun}
                </TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell
                    key={VERBS[i]}
                    className={cn(
                      "text-center",
                      cell.special && "font-bold text-primary"
                    )}
                  >
                    {cell.form}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block size-2.5 rounded-full bg-primary" />
        Hervorgehoben = irregular / special form.
      </p>

      <div className="rounded-lg border bg-muted/40 p-4">
        <h4 className="mb-2 text-sm font-semibold">Merke / Rules</h4>
        <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Regular endings:</span>{" "}
            ich <code>-e</code>, du <code>-st</code>, er/sie/es <code>-t</code>, wir{" "}
            <code>-en</code>, ihr <code>-t</code>, sie/Sie <code>-en</code>.
          </li>
          <li>
            Stem ends in <code>-s / -ß / -z / -x</code> → the <em>du</em> form drops
            the extra s (<span className="font-medium text-foreground">du heißt</span>,
            not <span className="line-through">du heißst</span>).
          </li>
          <li>
            Stem ends in <code>-t / -d</code> → insert <code>-e-</code> before st/t
            (<span className="font-medium text-foreground">du arbeitest</span>, er
            arbeitet, ihr arbeitet).
          </li>
          <li>
            Vowel-change verbs change the stem vowel in <em>du</em> and{" "}
            <em>er/sie/es</em> only (sprechen → du{" "}
            <span className="font-medium text-foreground">sprichst</span>, er{" "}
            <span className="font-medium text-foreground">spricht</span>); wir/ihr/sie
            keep the normal stem.
          </li>
          <li>
            <span className="font-medium text-foreground">sein</span> is completely
            irregular and must be memorized.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2 — der / die / das
// ---------------------------------------------------------------------------

const GENDERS: {
  article: string;
  label: string;
  accent: string;
  categories: string;
  endings: string[];
  examples: string;
}[] = [
  {
    article: "der",
    label: "maskulin",
    accent: "text-blue-600 dark:text-blue-400",
    categories:
      "male people & animals; days, months, seasons; points of the compass, weather (der Montag, der Sommer, der Norden, der Wind).",
    endings: ["-er", "-ling", "-ismus", "-ant", "-or", "-ist", "-ig"],
    examples: "der Mann, der Lehrer, der Frühling, der Motor",
  },
  {
    article: "die",
    label: "feminin",
    accent: "text-rose-600 dark:text-rose-400",
    categories:
      "female people & animals; most nouns ending in -e; cardinal numbers as nouns.",
    endings: [
      "-e",
      "-ung",
      "-heit",
      "-keit",
      "-schaft",
      "-tion",
      "-tät/-ität",
      "-ik",
      "-ur",
      "-ei",
    ],
    examples:
      "die Frau, die Sprache, die Zeitung, die Universität, die Informatik",
  },
  {
    article: "das",
    label: "neutrum",
    accent: "text-emerald-600 dark:text-emerald-400",
    categories:
      "young people & animals; infinitives used as nouns; letters/colors as nouns; many metals.",
    endings: ["-chen", "-lein (diminutives)", "-ment", "-um", "-ma", "-tum"],
    examples: "das Kind, das Mädchen, das Essen, das Studium, das Gold",
  },
];

function ArticlesTab() {
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <Table className="text-[0.8rem]">
          <TableHeader>
            <TableRow>
              <TableHead>Genus</TableHead>
              <TableHead>Typical signals / categories</TableHead>
              <TableHead>Typical endings</TableHead>
              <TableHead>Examples</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GENDERS.map((g) => (
              <TableRow key={g.article} className="align-top">
                <TableCell className="whitespace-nowrap">
                  <span className={cn("text-base font-bold", g.accent)}>
                    {g.article}
                  </span>
                  <span className="block text-[0.7rem] text-muted-foreground">
                    {g.label}
                  </span>
                </TableCell>
                <TableCell className="max-w-[16rem] whitespace-normal text-muted-foreground">
                  {g.categories}
                </TableCell>
                <TableCell className="max-w-[10rem] whitespace-normal">
                  <span className="flex flex-wrap gap-1">
                    {g.endings.map((e) => (
                      <code
                        key={e}
                        className="rounded bg-muted px-1 py-0.5 text-[0.7rem]"
                      >
                        {e}
                      </code>
                    ))}
                  </span>
                </TableCell>
                <TableCell className="max-w-[12rem] whitespace-normal">
                  {g.examples}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        These are tendencies, not absolute laws — always learn the article with the
        noun. The one reliable rule:{" "}
        <span className="font-medium text-foreground">-chen / -lein</span>{" "}
        diminutives are ALWAYS{" "}
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          das
        </span>{" "}
        (that&apos;s why it&apos;s <span className="italic">das Mädchen</span> even
        though it means &ldquo;girl&rdquo;).
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel shell — resizable Sheet
// ---------------------------------------------------------------------------

/**
 * The inner content of the rules panel — header bar + tabs + tables.
 * Rendered inside the right ResizablePanel by <AppShell>.
 */
export function RulesContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-popover text-popover-foreground">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-heading text-base font-medium">Grammatik — Rules</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <Tabs defaultValue="verben" className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList className="mx-4 mt-4 w-[calc(100%-2rem)]">
          <TabsTrigger value="verben">Verben (Präsens)</TabsTrigger>
          <TabsTrigger value="artikel">der / die / das</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TabsContent value="verben" className="mt-0">
            <VerbsTab />
          </TabsContent>
          <TabsContent value="artikel" className="mt-0">
            <ArticlesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
