// Reads game entries from a public Google Sheet via its CSV export endpoint.
import axios from 'axios';
import { GameEntry } from './game-entry';
import { parseContent } from './parser';

export { GameEntry };

// Builds the CSV export URL from a Google Sheets share/edit URL.
// Handles both /edit#gid=... and /edit?gid=... forms.
// Exported for testing.
export function toExportUrl(sheetUrl: string): string {
  const idMatch = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(sheetUrl);
  if (!idMatch) throw new Error(`Could not extract spreadsheet ID from URL: ${sheetUrl}`);
  const id = idMatch[1];

  const gidMatch = /[?#&]gid=(\d+)/.exec(sheetUrl);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export async function readSheet(sheetUrl: string): Promise<GameEntry[]> {
  const exportUrl = toExportUrl(sheetUrl);
  const response = await axios.get(exportUrl, { responseType: 'text' });
  return parseContent(response.data);
}
