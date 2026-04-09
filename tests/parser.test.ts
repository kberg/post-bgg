import { describe, it, expect } from 'vitest';
import { parseContent } from '../src/parser';

const BASE_URL = 'https://boardgamegeek.com/boardgame/266192/wingspan';

function csv(...rows: string[]): string {
  return ['Title,Cost,Condition,Notes,URL,Available', ...rows].join('\n');
}

function row(overrides: Partial<Record<'title' | 'cost' | 'condition' | 'notes' | 'url' | 'available', string>> = {}): string {
  const r = {
    title: 'Wingspan',
    cost: '$45',
    condition: 'Good',
    notes: 'Some notes',
    url: BASE_URL,
    available: '',
    ...overrides,
  };
  return `${r.title},${r.cost},${r.condition},${r.notes},${r.url},${r.available}`;
}

describe('parseContent', () => {
  it('parses a basic row correctly', async () => {
    const entries = await parseContent(csv(row()));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      title: 'Wingspan',
      cost: '45',
      condition: 'Good',
      notes: 'Some notes',
      url: BASE_URL,
      bggId: 266192,
    });
  });

  it('handles case-insensitive headers', async () => {
    const content = ['TITLE,COST,CONDITION,NOTES,URL,AVAILABLE', row()].join('\n');
    const entries = await parseContent(content);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Wingspan');
  });

  it('skips rows with X in Available', async () => {
    const entries = await parseContent(csv(row({ available: 'X' })));
    expect(entries).toHaveLength(0);
  });

  it('skips rows with empty title', async () => {
    const entries = await parseContent(csv(row({ title: '' })));
    expect(entries).toHaveLength(0);
  });

  it('strips $ from cost', async () => {
    const entries = await parseContent(csv(row({ cost: '$45' })));
    expect(entries[0].cost).toBe('45');
  });

  it('ignores cost without $ prefix', async () => {
    const entries = await parseContent(csv(row({ cost: '45' })));
    expect(entries[0].cost).toBe('');
  });

  it('handles empty cost', async () => {
    const entries = await parseContent(csv(row({ cost: '' })));
    expect(entries[0].cost).toBe('');
  });

  it('rejects when URL is missing', async () => {
    await expect(parseContent(csv(row({ url: '' })))).rejects.toThrow('Row 2');
  });

  it('rejects when URL is not a BGG URL', async () => {
    await expect(parseContent(csv(row({ url: 'https://example.com/game/123' })))).rejects.toThrow('Row 2');
  });

  it('includes row number in error for bad URL', async () => {
    const content = csv(row(), row({ url: 'https://example.com' }));
    await expect(parseContent(content)).rejects.toThrow('Row 3');
  });

  it('returns only available rows from mixed input', async () => {
    const content = csv(
      row({ title: 'Wingspan', available: '' }),
      row({ title: 'Gloomhaven', available: 'X' }),
      row({ title: 'Pandemic', available: '' }),
    );
    const entries = await parseContent(content);
    expect(entries).toHaveLength(2);
    expect(entries.map(e => e.title)).toEqual(['Wingspan', 'Pandemic']);
  });

  it('extracts BGG ID from URL', async () => {
    const entries = await parseContent(csv(row({ url: 'https://boardgamegeek.com/boardgame/174430/gloomhaven' })));
    expect(entries[0].bggId).toBe(174430);
  });

  it('handles empty condition and notes', async () => {
    const entries = await parseContent(csv(row({ condition: '', notes: '' })));
    expect(entries[0].condition).toBe('');
    expect(entries[0].notes).toBe('');
  });
});
