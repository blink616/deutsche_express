# 🚂 Deutsche Express

A local German-vocabulary flashcard app. Upload CSV or comma-separated word
lists, study them as flip cards grouped by the day you added them, and track
your progress per word and per day.

**Stack:** Next.js (App Router) · React · tRPC · Prisma · PostgreSQL · Tailwind CSS · shadcn/ui · Docker

## Run locally with PostgreSQL in Docker

```bash
npm install
npm run db:up
npm run db:migrate
npm run dev
```

Then open <http://localhost:3000>. Docker runs only PostgreSQL; Next.js and
Prisma run directly on your machine. Database data persists in the `db-data`
Docker volume across restarts.

The local app reads `DATABASE_URL` from `.env`. It should point to the database
port exposed by Docker:

```env
DATABASE_URL="postgresql://deutsch:deutsch@localhost:5432/deutsche_express"
```

## CSV format

Four comma-separated columns — the last two are optional. A header row is
detected and skipped automatically. Wrap a field in double quotes if it
contains a comma. Try `sample-words.csv` in this repo.

```csv
german,english,german_sentence,english_sentence
der Hund,the dog,Der Hund schläft im Garten.,The dog is sleeping in the garden.
```

You can upload a `.csv`/`.txt` file or paste the lines directly on the
**Upload** page. Words land in the deck for the day you upload them;
duplicates (same German + English pair) are skipped automatically.

## How progress works

- Every flashcard answer is recorded as a review.
- Reviews are grouped into study sessions. Missed typed answers also retain what
  you entered and whether the problem was the article, a wrong answer, or a reveal.
- **New** → never studied. **Learning** → studied at least once.
  **Learned** → answered correctly 3 times in a row (a miss resets the streak).
- The dashboard shows totals, today's review count, overall accuracy, and a
  per-day progress bar (learned / learning / new).
- Decks: any single day, **All words**, or **Practice unlearned**.
- The **Mistakes** page ranks frequently missed words and lets you replay misses
  from yesterday or from an individual recent session.
- Two study modes, switchable mid-session: **Flashcards** (flip and self-grade)
  and **Type answer** (you type the German for the shown English and it's
  checked for you — umlaut-friendly, so `schoen` counts for `schön`, with a
  hint when only the article is wrong).

Keyboard shortcuts while studying: **space** flips the card, **→** = got it,
**←** = missed it. In type mode, **enter** checks your answer and moves on.

## Project layout

```
prisma/schema.prisma        # Word, Review, and StudySession models (PostgreSQL)
src/server/                 # tRPC routers (words, study, stats) + CSV parser
src/app/                    # pages: dashboard, /upload, /study/[deck], /day/[date]
src/components/             # flashcard session, day browser
docker-compose.yml          # local PostgreSQL service only
```

## Useful commands

```bash
npm run db:studio      # browse the database in Prisma Studio
npm run db:up          # start PostgreSQL; remove any old app container
npm run db:down        # stop PostgreSQL (data is preserved)
npm run db:migrate     # apply migrations (prisma migrate deploy)
```
