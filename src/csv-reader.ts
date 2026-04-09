// Reads the input CSV and returns a list of GameEntry objects.
import { parse } from 'csv-parse';
import * as fs from 'fs';

export interface GameEntry {
  title: string;
  cost: string;
  condition: string;
  notes: string;
  url: string;
  bggId: number;
}

const BGG_ID_PATTERN = /boardgamegeek\.com\/[^/]+\/(\d+)/;

function extractBggId(url: string): number {
  const match = BGG_ID_PATTERN.exec(url);
  if (!match) {
    throw new Error(`Could not extract BGG ID from URL: ${url}`);
  }
  return parseInt(match[1], 10);
}

// Costs must include a currency symbol (e.g. $45) to be used; bare numbers are ignored.
function parseCost(raw: string | undefined): string {
  if (!raw) return '';
  const stripped = raw.replace(/^\$/, '');
  return stripped !== raw ? stripped : '';
}

export async function readCsv(filePath: string): Promise<GameEntry[]> {
  const content = fs.readFileSync(filePath, 'utf-8');

  return new Promise((resolve, reject) => {
    // Normalize headers to lowercase so column names are case-insensitive.
    const normalizeHeader = (headers: string[]) => headers.map(h => h.toLowerCase());
    parse(content, { columns: normalizeHeader, trim: true, skip_empty_lines: true }, (err, records: Record<string, string>[]) => {
      if (err) return reject(err);

      const entries: GameEntry[] = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNum = i + 2; // 1-indexed, +1 for header

        const title = row['title'];
        const cost = row['cost'];
        const condition = row['condition'];
        const notes = row['notes'];
        const url = row['url'];
        const available = row['available'];

        if (!title) continue;
        // 'X' in the Available column means the item has been sold/removed.
        if (available?.trim().toUpperCase() === 'X') continue;
        if (!url) throw new Error(`Row ${rowNum}: missing 'url'`);

        let bggId: number;
        try {
          bggId = extractBggId(url);
        } catch (e) {
          return reject(new Error(`Row ${rowNum}: ${(e as Error).message}`));
        }

        entries.push({ title, cost: parseCost(cost), condition: condition ?? '', notes: notes ?? '', url, bggId });
      }

      resolve(entries);
    });
  });
}
