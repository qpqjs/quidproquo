import { describe, expect, it } from 'vitest';

import { reportQueuedEventProblem } from './reportQueuedEventProblem';

const event = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'documentRendered',
  at: '2026-11-09T05:12:40.118Z',
  utcOffset: '+10:00',
  dimensions: { templateKind: 'docx', outcome: 'ok', pages: 4, signed: true },
  measures: { pages: 4, renderMs: 812 },
  ...overrides,
});

describe('reportQueuedEventProblem', () => {
  it('accepts any type, dimensions and measures inside the bounds', () => {
    expect(reportQueuedEventProblem(event())).toBeNull();
    expect(reportQueuedEventProblem(event({ type: 'pack.built_v2-x', dimensions: {}, measures: {} }))).toBeNull();
  });

  it("refuses a type that could break a document id, a blob path or a FIFO group: '/', '#', '~', a leading digit, over 64", () => {
    ['bad/type', 'bad#type', 'bad~type', '9lives', '', 'a'.repeat(65), 42].forEach((type) =>
      expect(reportQueuedEventProblem(event({ type }))).toContain('type must start with a letter'),
    );
  });

  it('wants at in the exact form toISOString writes, and a real offset', () => {
    expect(reportQueuedEventProblem(event({ at: '2026-11-09' }))).toContain('at must be');
    expect(reportQueuedEventProblem(event({ at: 'yesterday' }))).toContain('at must be');
    expect(reportQueuedEventProblem(event({ utcOffset: '+10' }))).toContain('utcOffset');
    expect(reportQueuedEventProblem(event({ utcOffset: '+15:00' }))).toContain('utcOffset');
  });

  it('refuses dimensions that are not flat categories, or too many of them', () => {
    expect(reportQueuedEventProblem(event({ dimensions: { kinds: ['docx'] } }))).toContain("'kinds'");
    expect(reportQueuedEventProblem(event({ dimensions: Object.fromEntries(Array.from({ length: 13 }, (_, n) => [`d${n}`, 'x'])) }))).toContain(
      'at most 12 dimensions',
    );
  });

  it('refuses names that are Object.prototype members, or empty', () => {
    expect(reportQueuedEventProblem(event({ dimensions: JSON.parse('{"__proto__": "x"}') }))).toContain("'__proto__'");
    expect(reportQueuedEventProblem(event({ measures: { constructor: 1 } }))).toContain("'constructor'");
    expect(reportQueuedEventProblem(event({ dimensions: { '': 'x' } }))).toContain("''");
  });

  it('refuses measures that are not finite numbers', () => {
    expect(reportQueuedEventProblem(event({ measures: { pages: '4' } }))).toContain("measure 'pages'");
    expect(reportQueuedEventProblem(event({ measures: { pages: Number.POSITIVE_INFINITY } }))).toContain("measure 'pages'");
  });

  it('refuses an unknown field and an event past the size cap, so free text cannot ride along', () => {
    expect(reportQueuedEventProblem(event({ note: 'x' }))).toContain("unknown key 'note'");
    expect(reportQueuedEventProblem(event({ dimensions: { comment: 'x'.repeat(2100) } }))).toContain('at most 2048 bytes');
  });
});
