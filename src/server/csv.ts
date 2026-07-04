export type ParsedWord = {
  german: string;
  english: string;
  exampleGerman: string | null;
  exampleEnglish: string | null;
};

export type ParseResult = {
  words: ParsedWord[];
  /** Rows that were dropped: missing german/english, or duplicated within the same upload. */
  skippedRows: number;
};

/**
 * Minimal RFC-4180-style CSV parser: quoted fields, escaped quotes ("") and
 * CRLF line endings. Blank lines are ignored.
 */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.some((f) => f.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n") {
      pushRow();
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) pushRow();
  return rows;
}

function looksLikeHeader(row: string[]): boolean {
  const joined = row.join(" ").toLowerCase();
  return joined.includes("german") && joined.includes("english");
}

/**
 * Columns: german, english, german example sentence (optional),
 * english translation of the sentence (optional). A header row is skipped
 * automatically if present.
 */
export function parseWordList(text: string): ParseResult {
  const rows = parseRows(text);
  if (rows.length > 0 && looksLikeHeader(rows[0])) rows.shift();

  const words: ParsedWord[] = [];
  const seen = new Set<string>();
  let skippedRows = 0;

  for (const row of rows) {
    const [german = "", english = "", exampleGerman = "", exampleEnglish = ""] = row.map(
      (f) => f.trim(),
    );
    const key = `${german.toLowerCase()}|${english.toLowerCase()}`;
    if (!german || !english || seen.has(key)) {
      skippedRows++;
      continue;
    }
    seen.add(key);
    words.push({
      german,
      english,
      exampleGerman: exampleGerman || null,
      exampleEnglish: exampleEnglish || null,
    });
  }

  return { words, skippedRows };
}
