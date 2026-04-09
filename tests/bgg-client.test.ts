import { describe, it, expect } from 'vitest';
import { sleep } from '../src/bgg-client';

describe('sleep', () => {
  it('resolves after the specified delay', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});
