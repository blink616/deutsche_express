import { router } from "@/server/trpc";
import { statsRouter } from "@/server/routers/stats";
import { studyRouter } from "@/server/routers/study";
import { wordsRouter } from "@/server/routers/words";

export const appRouter = router({
  words: wordsRouter,
  study: studyRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
