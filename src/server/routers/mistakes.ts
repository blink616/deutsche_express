import { z } from "zod";
import { prisma } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";

type MistakeReview = {
  submittedAnswer: string | null;
  mistakeKind: string | null;
  reviewedAt: Date;
  word: {
    id: number;
    german: string;
    english: string;
    incorrect: number;
    correct: number;
    status: "NEW" | "LEARNING" | "LEARNED";
  };
};

function groupMistakes(reviews: MistakeReview[]) {
  const grouped = new Map<
    number,
    MistakeReview["word"] & {
      misses: number;
      lastMissedAt: Date;
      lastAnswer: string | null;
      lastMistakeKind: string | null;
    }
  >();

  for (const review of reviews) {
    const current = grouped.get(review.word.id);
    if (current) {
      current.misses++;
      continue;
    }
    grouped.set(review.word.id, {
      ...review.word,
      misses: 1,
      lastMissedAt: review.reviewedAt,
      lastAnswer: review.submittedAnswer,
      lastMistakeKind: review.mistakeKind,
    });
  }
  return [...grouped.values()];
}

const mistakeReviewSelect = {
  submittedAnswer: true,
  mistakeKind: true,
  reviewedAt: true,
  word: {
    select: {
      id: true,
      german: true,
      english: true,
      incorrect: true,
      correct: true,
      status: true,
    },
  },
} as const;

export const mistakesRouter = router({
  overview: publicProcedure
    .input(z.object({ yesterdayStart: z.date(), todayStart: z.date() }))
    .query(async ({ input }) => {
      const [recurring, yesterdayReviews, sessions] = await Promise.all([
        prisma.word.findMany({
          where: { incorrect: { gt: 0 } },
          orderBy: [{ incorrect: "desc" }, { lastReviewedAt: "desc" }],
          include: {
            reviews: {
              where: { correct: false },
              orderBy: { reviewedAt: "desc" },
              take: 1,
              select: {
                reviewedAt: true,
                submittedAnswer: true,
                mistakeKind: true,
              },
            },
          },
        }),
        prisma.review.findMany({
          where: {
            correct: false,
            reviewedAt: { gte: input.yesterdayStart, lt: input.todayStart },
          },
          orderBy: { reviewedAt: "desc" },
          select: mistakeReviewSelect,
        }),
        prisma.studySession.findMany({
          where: { reviews: { some: {} } },
          orderBy: { startedAt: "desc" },
          take: 20,
          include: {
            reviews: {
              orderBy: { reviewedAt: "desc" },
              select: { correct: true, ...mistakeReviewSelect },
            },
          },
        }),
      ]);

      return {
        recurring: recurring.map(({ reviews, ...word }) => ({
          ...word,
          lastMissedAt: reviews[0]?.reviewedAt ?? null,
          lastAnswer: reviews[0]?.submittedAnswer ?? null,
          lastMistakeKind: reviews[0]?.mistakeKind ?? null,
        })),
        yesterday: groupMistakes(yesterdayReviews),
        sessions: sessions.map((session) => {
          const mistakes = groupMistakes(session.reviews.filter((review) => !review.correct));
          return {
            id: session.id,
            deck: session.deck,
            startedAt: session.startedAt,
            total: session.reviews.length,
            correct: session.reviews.filter((review) => review.correct).length,
            mistakes,
          };
        }),
      };
    }),
});
