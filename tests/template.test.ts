import { describe, it, expect } from 'vitest';
import Handlebars from 'handlebars';
import { renderEntry } from '../src/template';
import { GameEntry } from '../src/game-entry';

function compile(source: string) {
  return Handlebars.compile(source, { noEscape: true });
}

const baseEntry: GameEntry = {
  title: 'Wingspan',
  cost: '45',
  condition: 'Near mint',
  notes: 'Includes promos',
  url: 'https://boardgamegeek.com/boardgame/266192/wingspan',
  bggId: 266192,
};

describe('renderEntry', () => {
  it('interpolates all fields', () => {
    const template = compile('{{title}} ${{cost}} {{condition}} {{notes}}');
    expect(renderEntry(template, baseEntry)).toBe('Wingspan $45 Near mint Includes promos');
  });

  it('omits cost block when cost is empty', () => {
    const template = compile('{{#if cost}}${{cost}}{{/if}}');
    expect(renderEntry(template, { ...baseEntry, cost: '' })).toBe('');
  });

  it('renders cost block when cost is present', () => {
    const template = compile('{{#if cost}}${{cost}}{{/if}}');
    expect(renderEntry(template, baseEntry)).toBe('$45');
  });

  it('does not HTML-escape ampersands', () => {
    const template = compile('{{notes}}');
    expect(renderEntry(template, { ...baseEntry, notes: 'Games & More' })).toBe('Games & More');
  });

  it('does not HTML-escape apostrophes', () => {
    const template = compile('{{title}}');
    expect(renderEntry(template, { ...baseEntry, title: "It's a Wonderful World" })).toBe("It's a Wonderful World");
  });
});
