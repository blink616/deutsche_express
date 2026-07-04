import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parseWordList } from "@/server/csv";
import { prisma } from "@/server/db";
import { publicProcedure, router } from "@/server/trpc";

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

export const wordsRouter = router({
  upload: publicProcedure
    .input(z.object({ text: z.string().min(1), localDate: dateString }))
    .mutation(async ({ input }) => {
      const { words, skippedRows } = parseWordList(input.text);
      if (words.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No valid rows found. Expected columns: german, english, german sentence (optional), english translation (optional).",
        });
      }
      const result = await prisma.word.createMany({
        data: words.map((w) => ({ ...w, addedOn: new Date(input.localDate) })),
        skipDuplicates: true,
      });
      return {
        added: result.count,
        duplicates: words.length - result.count,
        invalid: skippedRows,
        date: input.localDate,
      };
    }),

  groups: publicProcedure.query(async () => {
    const words = await prisma.word.findMany({
      select: { addedOn: true, status: true },
    });
    const map = new Map<
      string,
      { date: string; total: number; learned: number; learning: number; fresh: number }
    >();
    for (const w of words) {
      const key = w.addedOn.toISOString().slice(0, 10);
      const g = map.get(key) ?? { date: key, total: 0, learned: 0, learning: 0, fresh: 0 };
      g.total++;
      if (w.status === "LEARNED") g.learned++;
      else if (w.status === "LEARNING") g.learning++;
      else g.fresh++;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
  }),

  byDate: publicProcedure
    .input(z.object({ date: dateString }))
    .query(({ input }) =>
      prisma.word.findMany({
        where: { addedOn: new Date(input.date) },
        orderBy: { id: "asc" },
      }),
    ),

  remove: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await prisma.word.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
