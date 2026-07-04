import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";
import { dateString } from "@/server/routers/words";

const deckSchema = z.union([z.literal("all"), z.literal("practice"), dateString]);

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
    .input(z.object({ deck: deckSchema }))
    .query(async ({ input }) => {
      const where =
        input.deck === "all"
          ? {}
          : input.deck === "practice"
            ? { status: { not: "LEARNED" as const } }
            : { addedOn: new Date(input.deck) };
      const words = await prisma.word.findMany({ where });
      return shuffle(words);
    }),

  review: publicProcedure
    .input(z.object({ wordId: z.number().int(), correct: z.boolean() }))
    .mutation(async ({ input }) => {
      const word = await prisma.word.findUnique({ where: { id: input.wordId } });
      if (!word) throw new TRPCError({ code: "NOT_FOUND", message: "Word not found" });

      // Three correct answers in a row marks a word as learned; a miss
      // resets the streak and drops it back to "learning".
      const streak = input.correct ? word.streak + 1 : 0;
      const status = input.correct && streak >= 3 ? "LEARNED" : "LEARNING";

      const [updated] = await prisma.$transaction([
        prisma.word.update({
          where: { id: word.id },
          data: {
            correct: word.correct + (input.correct ? 1 : 0),
            incorrect: word.incorrect + (input.correct ? 0 : 1),
            streak,
            status,
            lastReviewedAt: new Date(),
          },
        }),
        prisma.review.create({ data: { wordId: word.id, correct: input.correct } }),
      ]);
      return updated;
    }),
});
