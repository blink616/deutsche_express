"use client";

import { ArrowRight, CheckCircle2, CircleAlert, FileUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { localToday } from "@/lib/format";
import { trpc } from "@/lib/trpc";

const SAMPLE = `german,english,german_sentence,english_sentence
der Hund,the dog,Der Hund schläft im Garten.,The dog is sleeping in the garden.
die Katze,the cat,Die Katze sitzt auf dem Sofa.,The cat is sitting on the sofa.
laufen,to run,Ich laufe jeden Morgen im Park.,I run in the park every morning.
"einkaufen","to shop","Ich kaufe Brot, Käse und Milch ein.","I am buying bread, cheese and milk."
schön,beautiful,Der Sonnenuntergang ist heute schön.,The sunset is beautiful today.`;

export default function UploadPage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const upload = trpc.words.upload.useMutation({
    onSuccess: () => {
      setText("");
      setFileName(null);
      utils.invalidate();
    },
  });

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Upload words</h1>
        <p className="mt-1 text-muted-foreground">
          Add a CSV file or paste comma-separated lines. Words are grouped into today&apos;s
          deck.
        </p>
      </section>

      {upload.isSuccess && (
        <Alert>
          <CheckCircle2 className="text-good" />
          <AlertTitle>
            Added {upload.data.added} new {upload.data.added === 1 ? "word" : "words"} to
            today&apos;s deck
          </AlertTitle>
          <AlertDescription>
            {(upload.data.duplicates > 0 || upload.data.invalid > 0) && (
              <p>
                Skipped {upload.data.duplicates}{" "}
                {upload.data.duplicates === 1 ? "duplicate" : "duplicates"} and{" "}
                {upload.data.invalid} invalid {upload.data.invalid === 1 ? "line" : "lines"}.
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <Button size="sm" asChild>
                <Link href={`/study/${upload.data.date}`}>
                  Study them now <ArrowRight />
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {upload.error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription>{upload.error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="size-4" /> Choose a file or paste
          </CardTitle>
          <CardDescription>
            Accepts .csv and .txt — or type the lines straight into the box.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={(e) => onFile(e.target.files?.[0])}
              className="max-w-xs"
            />
            {fileName && (
              <span className="text-xs text-muted-foreground">Loaded: {fileName}</span>
            )}
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={
              "…or paste lines here, e.g.\n\nder Hund,the dog,Der Hund schläft.,The dog is sleeping."
            }
            className="min-h-56 font-mono text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => upload.mutate({ text, localDate: localToday() })}
              disabled={text.trim() === "" || upload.isPending}
            >
              <FileUp /> {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
            <Button variant="outline" onClick={() => setText(SAMPLE)}>
              <Sparkles /> Load sample
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format</CardTitle>
          <CardDescription>
            One word per line, four comma-separated columns — the last two are optional. A
            header row is detected and skipped automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="overflow-x-auto rounded-lg bg-muted p-3">
            <code className="block text-xs whitespace-pre">
              {"german, english, german example sentence, english translation\nder Hund, the dog, Der Hund schläft im Garten., The dog is sleeping in the garden."}
            </code>
          </div>
          <p className="text-sm text-muted-foreground">
            Wrap a field in double quotes if it contains a comma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
