# 🚂 Deutsche Express

A local German-vocabulary flashcard app. Upload CSV or comma-separated word
lists, study them as flip cards grouped by the day you added them, and track
your progress per word and per day.

**Stack:** Next.js (App Router) · React · tRPC · Prisma · PostgreSQL · Tailwind CSS · shadcn/ui · Docker

## Run it (Docker, one command)

```bash
docker compose up --build
```

Then open <http://localhost:3000>. This starts Postgres and the app; database
migrations are applied automatically on startup. Data persists in the
`db-data` Docker volume across restarts.

## Run it (local development)

```bash
docker compose up -d db        # just the database
npm install
npx prisma migrate deploy      # apply migrations
npm run dev                    # http://localhost:3000 with hot reload
```

The dev server reads `DATABASE_URL` from `.env` (defaults to
`postgresql://deutsch:deutsch@localhost:5432/deutsche_express`).

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
- **New** → never studied. **Learning** → studied at least once.
  **Learned** → answered correctly 3 times in a row (a miss resets the streak).
- The dashboard shows totals, today's review count, overall accuracy, and a
  per-day progress bar (learned / learning / new).
- Decks: any single day, **All words**, or **Practice unlearned**.
- Two study modes, switchable mid-session: **Flashcards** (flip and self-grade)
  and **Type answer** (you type the German for the shown English and it's
  checked for you — umlaut-friendly, so `schoen` counts for `schön`, with a
  hint when only the article is wrong).

Keyboard shortcuts while studying: **space** flips the card, **→** = got it,
**←** = missed it. In type mode, **enter** checks your answer and moves on.

## Project layout

```
prisma/schema.prisma        # Word + Review models (PostgreSQL)
src/server/                 # tRPC routers (words, study, stats) + CSV parser
src/app/                    # pages: dashboard, /upload, /study/[deck], /day/[date]
src/components/             # flashcard session, day browser
Dockerfile                  # multi-stage build; runs migrations on start
docker-compose.yml          # postgres + web
```

## Useful commands

```bash
npm run db:studio      # browse the database in Prisma Studio
npm run db:migrate     # apply migrations (prisma migrate deploy)
docker compose down    # stop everything (add -v to wipe the database)
```
