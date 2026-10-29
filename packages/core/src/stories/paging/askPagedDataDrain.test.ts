import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AskResponse, QpqPagedData } from '../../types';
import { askPagedDataDrain } from './askPagedDataDrain';

const pages: Record<string, QpqPagedData<number>> = {
  first: { items: [1, 2], nextPageKey: 'two' },
  two: { items: [3], nextPageKey: 'three' },
  three: { items: [4] },
};

function* askPage(nextPageKey?: string): AskResponse<QpqPagedData<number>> {
  return pages[nextPageKey ?? 'first']!;
}

describe('askPagedDataDrain', () => {
  it('walks every page and returns the items flat with no next key', () => {
    expect(runStory(askPagedDataDrain(askPage))).toEqual({ items: [1, 2, 3, 4], nextPageKey: undefined });
  });

  it('starts from the given page key', () => {
    expect(runStory(askPagedDataDrain(askPage, { startPageKey: 'two' }))).toEqual({ items: [3, 4], nextPageKey: undefined });
  });

  it('stops early when asked and hands back the next unread key', () => {
    const result = runStory(
      askPagedDataDrain(askPage, {
        *askShouldContinue(collected) {
          return collected.length < 3;
        },
      }),
    );

    expect(result).toEqual({ items: [1, 2, 3], nextPageKey: 'three' });
  });

  it('does not ask whether to continue once the last page has landed', () => {
    let asked = 0;

    runStory(
      askPagedDataDrain(askPage, {
        startPageKey: 'three',
        *askShouldContinue() {
          asked += 1;
          return false;
        },
      }),
    );

    expect(asked).toBe(0);
  });
});
