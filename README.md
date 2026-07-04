# 🚂 Deutsche Express

I started studying German because apparently my life did not already contain
enough rules, exceptions, grammatical genders, and words long enough to qualify
as short-term rental agreements.

Naturally, my ADHD brain responded by forgetting yesterday’s vocabulary,
opening fourteen unrelated tabs, reorganizing the study plan, and building an
entire web application instead of simply reviewing the flashcards.

So here it is: **Deutsche Express**, a German-vocabulary tracker for anyone who
would rather engineer a spaced-repetition-adjacent database system than remember
whether a table is masculine, feminine, or spiritually neutral.

**Stack:** Next.js · React · tRPC · Prisma · PostgreSQL · Tailwind CSS · shadcn/ui

## What this monument to productive procrastination does

- Uploads vocabulary from CSV or pasted text, because typing each word manually
  would be an outrageous use of the time we are definitely spending efficiently.
- Groups words by the day they were added, allowing you to revisit the exact date
  on which optimism briefly defeated executive dysfunction.
- Provides flashcard and typed-answer modes.
- Accepts umlaut substitutions such as `schoen` for `schön`, because installing a
  German keyboard layout should not become this week’s completely unrelated quest.
- Tracks correct answers, mistakes, streaks, and learned words in PostgreSQL. Your
  failures are now durable, indexed, and professionally normalized.
- Stores study sessions and the actual wrong answers you typed.
- Shows yesterday’s mistakes, frequently missed words, and mistakes from previous
  sessions, in case forgetting them once lacked sufficient ceremony.
- Lets you revisit previous cards without recording the answer twice.
- Copies words and example sentences separately, saving several devastating
  milliseconds of text selection.

## Running it

Only PostgreSQL runs in Docker. The application runs directly on your machine,
because putting absolutely everything in containers would risk finishing the
project before discovering a new infrastructure concern.

```bash
npm install
npm run db:up
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>, then study German instead of staring proudly at the
terminal output.

The app reads `DATABASE_URL` from `.env`:

```env
DATABASE_URL="postgresql://deutsch:deutsch@localhost:5432/deutsche_express"
```

Database data persists in the Docker volume, so restarting your computer will not
erase your progress. You will need to forget the words yourself.

## CSV format

Use four comma-separated columns. The example columns are optional, much like my
original intention to keep this project small.

```csv
german,english,german_sentence,english_sentence
der Hund,the dog,Der Hund schläft im Garten.,The dog is sleeping in the garden.
```

Headers are detected automatically. Fields containing commas should be wrapped in
double quotes. Duplicate German-English pairs are skipped, because the app has at
least one functioning memory system.

## How progress works

- Every answer becomes a review record.
- A new word starts as **New**.
- Once reviewed, it becomes **Learning**.
- Three correct answers in a row mark it **Learned**.
- One wrong answer resets the streak, because German believes character is built
  through immediate and measurable consequences.
- Typed mistakes retain your submitted answer and whether the issue was an article,
  an incorrect word, or the dignified surrender of pressing “I don’t know.”

Available decks include all words, unlearned words, words from a specific day, and
the ever-growing museum exhibit titled **Mistakes**.

## Keyboard shortcuts

- `Space` or `Enter`: flip a flashcard.
- `→`: mark it correct.
- `←`: mark it incorrect.
- In typing mode, `Enter`: check the answer or continue.

These shortcuts save enough time to open another tab without interrupting the
study session.

## Project layout

```text
prisma/schema.prisma        Word, review, and study-session models
prisma/migrations/          Permanent historical record of database decisions
src/server/                 tRPC routers and CSV parsing
src/app/                    Next.js pages and API routes
src/components/             Flashcards, tables, and buttons for coping efficiently
docker-compose.yml          PostgreSQL, and only PostgreSQL
```

## Commands I will absolutely remember without checking this section

```bash
npm run dev             # run the app locally
npm run build           # verify that optimism compiles
npm run db:up           # start PostgreSQL in Docker
npm run db:down         # stop PostgreSQL; preserve the data
npm run db:migrate      # apply database migrations
npm run db:studio       # inspect the database and confront the evidence
```

## The actual goal

The goal is still to learn German.

The application is finished enough. Close the editor. Review the words.

Yes, even the articles.
