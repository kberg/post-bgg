// Reads game entries from a local CSV file.
import * as fs from 'fs';
import { GameEntry } from './game-entry';
import { parseContent } from './parser';

export { GameEntry };

export async function readCsv(filePath: string): Promise<GameEntry[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseContent(content);
}
