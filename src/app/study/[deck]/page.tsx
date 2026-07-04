import { StudySession } from "@/components/study-session";

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ deck: string }>;
  searchParams: Promise<{ mode?: string; from?: string; to?: string; session?: string }>;
}) {
  const [{ deck }, query] = await Promise.all([params, searchParams]);
  const from = parseDate(query.from);
  const to = parseDate(query.to);
  const sessionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    query.session ?? "",
  )
    ? query.session
    : undefined;

  return (
    <StudySession
      deck={decodeURIComponent(deck)}
      initialMode={query.mode === "type" ? "type" : "flip"}
      mistakeFilter={from && to ? { from, to } : sessionId ? { sessionId } : undefined}
    />
  );
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
