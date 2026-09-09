import { QpqIsoDateTime } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EventDocSummary, EventDocVersion } from '../../models';
import { draftVersion } from './draftVersion';
import { latestPublished } from './latestPublished';
import { latestVersion } from './latestVersion';
import { maxByVersion } from './maxByVersion';
import { publishedAsOf } from './publishedAsOf';

const eventId = (n: number): number => n;

const iso = (s: string): QpqIsoDateTime => s as QpqIsoDateTime;

const model = (versions: EventDocVersion[]): EventDocSummary => ({
  type: 'template',
  id: 'abc',
  code: 'footer',
  name: 'Footer',
  createdAt: iso('2026-01-01T00:00:00.000Z'),
  updatedAt: iso('2026-01-01T00:00:00.000Z'),
  createdBy: 'user-1',
  updatedBy: 'user-1',
  versions,
});

const v = (version: number, publishedAt?: string): EventDocVersion => ({
  version,
  eventId: eventId(version),
  ...(publishedAt ? { publishedAt: iso(publishedAt) } : {}),
});

describe('event-doc selectors', () => {
  describe('maxByVersion / latestVersion', () => {
    it('returns undefined for no versions', () => {
      expect(maxByVersion([])).toBeNull();
      expect(latestVersion(model([]))).toBeNull();
    });

    it('returns the highest version regardless of array order', () => {
      const m = model([v(1, '2026-01-01T00:00:00.000Z'), v(3), v(2, '2026-02-01T00:00:00.000Z')]);
      expect(latestVersion(m)?.version).toBe(3);
    });
  });

  describe('latestPublished', () => {
    it('ignores the unpublished tail draft', () => {
      const m = model([v(1, '2026-01-01T00:00:00.000Z'), v(2, '2026-02-01T00:00:00.000Z'), v(3)]);
      expect(latestPublished(m)?.version).toBe(2);
    });

    it('returns undefined when nothing is published', () => {
      expect(latestPublished(model([v(1)]))).toBeNull();
    });
  });

  describe('publishedAsOf (as-of clock)', () => {
    const m = model([
      v(1, '2026-01-10T00:00:00.000Z'),
      v(2, '2026-02-10T00:00:00.000Z'),
      v(3, '2026-03-10T00:00:00.000Z'),
      v(4), // draft, never published
    ]);

    it('resolves the newest version published at or before the clock', () => {
      expect(publishedAsOf(m, iso('2026-02-15T00:00:00.000Z'))?.version).toBe(2);
    });

    it('is inclusive of the exact publish instant (<=)', () => {
      expect(publishedAsOf(m, iso('2026-02-10T00:00:00.000Z'))?.version).toBe(2);
    });

    it('returns undefined before any version was published', () => {
      expect(publishedAsOf(m, iso('2026-01-01T00:00:00.000Z'))).toBeNull();
    });

    it('never resolves to the draft even with a far-future clock', () => {
      expect(publishedAsOf(m, iso('2030-01-01T00:00:00.000Z'))?.version).toBe(3);
    });
  });

  describe('draftVersion', () => {
    it('returns the tail when it is unpublished', () => {
      const m = model([v(1, '2026-01-01T00:00:00.000Z'), v(2)]);
      expect(draftVersion(m)?.version).toBe(2);
    });

    it('returns undefined when the tail is published', () => {
      const m = model([v(1, '2026-01-01T00:00:00.000Z'), v(2, '2026-02-01T00:00:00.000Z')]);
      expect(draftVersion(m)).toBeNull();
    });
  });
});
