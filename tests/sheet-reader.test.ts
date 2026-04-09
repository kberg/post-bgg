import { describe, it, expect } from 'vitest';
import { toExportUrl } from '../src/sheet-reader';

const SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
const BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;

describe('toExportUrl', () => {
  it('extracts gid from hash fragment', () => {
    const url = toExportUrl(`${BASE}/edit#gid=123`);
    expect(url).toBe(`${BASE}/export?format=csv&gid=123`);
  });

  it('extracts gid from query string', () => {
    const url = toExportUrl(`${BASE}/edit?gid=456`);
    expect(url).toBe(`${BASE}/export?format=csv&gid=456`);
  });

  it('defaults gid to 0 when not present', () => {
    const url = toExportUrl(`${BASE}/edit`);
    expect(url).toBe(`${BASE}/export?format=csv&gid=0`);
  });

  it('throws for non-Google Sheets URL', () => {
    expect(() => toExportUrl('https://example.com/spreadsheets')).toThrow('Could not extract spreadsheet ID');
  });
});
