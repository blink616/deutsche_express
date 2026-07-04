import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";
import { dateString } from "@/server/routers/words";

const deckSchema = z.union([
  z.literal("all"),
  z.literal("practice"),
  z.literal("mistakes"),
  dateString,
]);

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const studyRouter = router({
  deck: publicProcedure
    .input(
      z.object({
        deck: deckSchema,
        from: z.date().optional(),
        to: z.date().optional(),
        sessionId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ input }) => {
      let where: Prisma.WordWhereInput;
      if (input.deck === "all") where = {};
      else if (input.deck === "practice") where = { status: { not: "LEARNED" } };
      else if (input.deck === "mistakes" && input.sessionId) {
        where = {
          reviews: { some: { sessionId: input.sessionId, correct: false } },
        };
      } else if (input.deck === "mistakes" && input.from && input.to) {
        where = {
          reviews: {
            some: {
              correct: false,
              reviewedAt: { gte: input.from, lt: input.to },
            },
          },
        };
      } else if (input.deck === "mistakes") {
        where = { incorrect: { gt: 0 }, status: { not: "LEARNED" } };
      } else where = { addedOn: new Date(input.deck) };

      const words = await prisma.word.findMany({ where });
      return shuffle(words);
    }),

  review: publicProcedure
    .input(
      z.object({
        wordId: z.number().int(),
        correct: z.boolean(),
        sessionId: z.string().uuid(),
        deck: deckSchema,
        mode: z.enum(["flip", "type"]),
        submittedAnswer: z.string().max(500).optional(),
        mistakeKind: z
          .enum(["SELF_REPORTED", "INCORRECT_ANSWER", "ARTICLE", "REVEALED"])
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const word = await prisma.word.findUnique({ where: { id: input.wordId } });
      if (!word) throw new TRPCError({ code: "NOT_FOUND", message: "Word not found" });

      // Three correct answers in a row marks a word as learned; a miss
      // resets the streak and drops it back to "learning".
      const streak = input.correct ? word.streak + 1 : 0;
      const status = input.correct && streak >= 3 ? "LEARNED" : "LEARNING";

      return prisma.$transaction(async (tx) => {
        await tx.studySession.upsert({
          where: { id: input.sessionId },
          create: { id: input.sessionId, deck: input.deck },
          update: {},
        });
        const updated = await tx.word.update({
          where: { id: word.id },
          data: {
            correct: { increment: input.correct ? 1 : 0 },
            incorrect: { increment: input.correct ? 0 : 1 },
            streak,
            status,
            lastReviewedAt: new Date(),
          },
        });
        await tx.review.create({
          data: {
            wordId: word.id,
            correct: input.correct,
            sessionId: input.sessionId,
            mode: input.mode,
            submittedAnswer: input.submittedAnswer || null,
            mistakeKind: input.correct ? null : input.mistakeKind,
          },
        });
        return updated;
      });
    }),
});
