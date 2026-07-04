import { StudySession } from "@/components/study-session";

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ deck: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ deck }, { mode }] = await Promise.all([params, searchParams]);
  return (
    <StudySession
      deck={decodeURIComponent(deck)}
      initialMode={mode === "type" ? "type" : "flip"}
    />
  );
}
