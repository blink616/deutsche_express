import { z } from "zod";
import { prisma } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";

export const statsRouter = router({
  overview: publicProcedure
    .input(z.object({ startOfToday: z.date() }))
    .query(async ({ input }) => {
      const [totalWords, byStatus, totalReviews, correctReviews, reviewsToday] =
        await Promise.all([
          prisma.word.count(),
          prisma.word.groupBy({ by: ["status"], _count: { _all: true } }),
          prisma.review.count(),
          prisma.review.count({ where: { correct: true } }),
          prisma.review.count({ where: { reviewedAt: { gte: input.startOfToday } } }),
        ]);

      const count = (status: "NEW" | "LEARNING" | "LEARNED") =>
        byStatus.find((b) => b.status === status)?._count._all ?? 0;

      return {
        totalWords,
        learned: count("LEARNED"),
        learning: count("LEARNING"),
        fresh: count("NEW"),
        totalReviews,
        reviewsToday,
        accuracy:
          totalReviews === 0 ? null : Math.round((correctReviews / totalReviews) * 100),
      };
    }),
});
