import { QpqExecutionTrace, QpqExecutionTraceValue } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import {
  buildLineAnnotations,
  formatLineAnnotation,
  getDefaultSourceIndex,
  getDisplaySourceNames,
  isExternalSourcePath,
  RETURNS_MATCH_NAME,
  searchStepValues,
} from './traceViewerLogic';

const v = (preview: string, json?: string): QpqExecutionTraceValue => (json === undefined ? { preview } : { preview, json });

const buildTrace = (steps: Array<Partial<QpqExecutionTrace['steps'][number]>>): QpqExecutionTrace => ({
  correlation: 'corr-1',
  moduleName: 'svc',
  tracedAt: '2026-01-01T00:00:00.000Z' as any,
  truncated: false,
  sources: [
    { path: 'src/story.ts', content: 'line1\nline2\nline3' },
    { path: 'src/helper.ts', content: 'helper' },
  ],
  steps: steps.map((step) => ({
    sourceIndex: 0,
    line: 1,
    column: 0,
    functionName: 'askStory',
    locals: {},
    ...step,
  })),
  stats: { pauses: 0, breakpoints: 0, replayMs: 0, localsCaptureMs: 0 },
});

describe('buildLineAnnotations', () => {
  it('attributes values produced by a line via the next step locals diff', () => {
    const trace = buildTrace([
      { line: 1, locals: { id: v('undefined') } },
      { line: 2, locals: { id: v('"guid-1"') } },
      { line: 3, locals: { id: v('"guid-1"'), name: v('"Ada"') } },
    ]);

    const annotations = buildLineAnnotations(trace, 0);

    expect(annotations.get(1)?.changes).toEqual({ id: '"guid-1"' });
    expect(annotations.get(2)?.changes).toEqual({ name: '"Ada"' });
    expect(annotations.get(3)?.changes).toEqual({});
  });

  it('detects changes at json depth even when previews collide', () => {
    const trace = buildTrace([
      { line: 1, locals: { user: v('{nested: Object}', '{"nested":{"a":1}}') } },
      { line: 2, locals: { user: v('{nested: Object}', '{"nested":{"a":2}}') } },
    ]);

    const annotations = buildLineAnnotations(trace, 0);

    expect(annotations.get(1)?.changes).toEqual({ user: '{nested: Object}' });
  });

  it('counts loop visits and keeps the last visit values', () => {
    const trace = buildTrace([
      { line: 2, locals: { i: v('0') } },
      { line: 2, locals: { i: v('1') } },
      { line: 2, locals: { i: v('2') } },
    ]);

    const annotations = buildLineAnnotations(trace, 0);

    expect(annotations.get(2)?.visitCount).toBe(3);
    expect(annotations.get(2)?.changes).toEqual({ i: '2' });
  });

  it('does not diff across function or source boundaries', () => {
    const trace = buildTrace([
      { line: 1, functionName: 'askStory', locals: {} },
      { line: 1, functionName: 'formatName', locals: { first: v('"Ada"') }, sourceIndex: 1 },
    ]);

    const annotations = buildLineAnnotations(trace, 0);

    expect(annotations.get(1)?.changes).toEqual({});
  });
});

describe('formatLineAnnotation', () => {
  it('shows visit counts and capped change entries', () => {
    const formatted = formatLineAnnotation({ visitCount: 3, changes: { a: '1', b: '2', c: '3', d: '4', e: '5' } }, 2);

    expect(formatted).toBe('×3 a = 1, b = 2, …');
  });

  it('omits the count for single visits', () => {
    expect(formatLineAnnotation({ visitCount: 1, changes: { total: '125' } })).toBe('total = 125');
  });

  it('shows returned values', () => {
    expect(formatLineAnnotation({ visitCount: 1, changes: {}, returned: '"First0 Last0"' })).toBe('→ "First0 Last0"');
    expect(formatLineAnnotation({ visitCount: 2, changes: { i: '1' }, returned: '25' })).toBe('×2 i = 1, → 25');
  });
});

describe('buildLineAnnotations return values', () => {
  it('attributes the returned value to the return line, last visit wins', () => {
    const trace = buildTrace([
      { line: 2, locals: {}, returnValue: v('"First0 Last0"') },
      { line: 2, locals: {}, returnValue: v('"First1 Last1"') },
    ]);

    const annotations = buildLineAnnotations(trace, 0);

    expect(annotations.get(2)?.returned).toBe('"First1 Last1"');
  });
});

describe('getDisplaySourceNames', () => {
  it('trims the shared directory prefix from bundle paths', () => {
    const names = getDisplaySourceNames([
      'file:///tmp/qpq-federated-code/qpq_template/2e90e67a12be/joe-coady_lib_esm_index_js-15d47e.js',
      'file:///tmp/qpq-federated-code/qpq_template/2e90e67a12be/src_entry_controller_ts.js',
    ]);

    expect(names).toEqual(['joe-coady_lib_esm_index_js-15d47e.js', 'src_entry_controller_ts.js']);
  });

  it('degrades to full paths when schemes differ (no common prefix)', () => {
    const names = getDisplaySourceNames(['file:///tmp/chunks/a.js', 'webpack://template/src/entry/controller.ts']);

    expect(names).toEqual(['file:///tmp/chunks/a.js', 'webpack://template/src/entry/controller.ts']);
  });

  it('trims deeper when all paths share the directory', () => {
    const names = getDisplaySourceNames(['webpack://svc/src/story.ts', 'webpack://svc/src/helpers/format.ts']);

    expect(names).toEqual(['story.ts', 'helpers/format.ts']);
  });

  it('uses the basename for a single source', () => {
    expect(getDisplaySourceNames(['file:///tmp/very/long/path/chunk-abc123.js'])).toEqual(['chunk-abc123.js']);
  });

  it('handles empty input', () => {
    expect(getDisplaySourceNames([])).toEqual([]);
  });
});

describe('getDefaultSourceIndex', () => {
  it('picks the source with the most steps', () => {
    const trace = buildTrace([{ sourceIndex: 1 }, { sourceIndex: 1 }, { sourceIndex: 0 }]);

    expect(getDefaultSourceIndex(trace)).toBe(1);
  });

  it('falls back to zero for an empty trace', () => {
    expect(getDefaultSourceIndex(buildTrace([]))).toBe(0);
  });
});

describe('searchStepValues', () => {
  const allIndexes = (trace: QpqExecutionTrace) => trace.steps.map((step, stepIndex) => stepIndex);

  it('finds a value in a preview, case-insensitively, reporting the matched local', () => {
    const trace = buildTrace([{ locals: { code: v("'CA_3c83'") } }, { locals: { other: v("'nope'") } }, { locals: { copy: v("'ca_3c83'") } }]);

    expect(searchStepValues(trace, 'ca_3C83', allIndexes(trace))).toEqual([
      { stepIndex: 0, matchedNames: ['code'] },
      { stepIndex: 2, matchedNames: ['copy'] },
    ]);
  });

  it('finds values nested in the deep json capture that the preview clamps away', () => {
    const trace = buildTrace([{ locals: { payload: v('{…}', '{"inner":{"token":"ca_deadbeef"}}') } }]);

    expect(searchStepValues(trace, 'ca_deadbeef', allIndexes(trace))).toEqual([{ stepIndex: 0, matchedNames: ['payload'] }]);
  });

  it('matches variable names and return values', () => {
    const trace = buildTrace([{ locals: { authCode: v("'x'") }, returnValue: v("'the authCode'") }]);

    expect(searchStepValues(trace, 'authcode', allIndexes(trace))).toEqual([{ stepIndex: 0, matchedNames: ['authCode', RETURNS_MATCH_NAME] }]);
  });

  it('only searches the given step indexes and returns nothing for an empty query', () => {
    const trace = buildTrace([{ locals: { code: v("'needle'") } }, { locals: { code: v("'needle'") } }]);

    expect(searchStepValues(trace, 'needle', [1])).toEqual([{ stepIndex: 1, matchedNames: ['code'] }]);
    expect(searchStepValues(trace, '', allIndexes(trace))).toEqual([]);
  });
});

describe('isExternalSourcePath', () => {
  it('marks node_modules paths as external', () => {
    expect(isExternalSourcePath('webpack://svc/node_modules/quidproquo-core/lib/story.js')).toBe(true);
  });

  it('keeps own source paths', () => {
    expect(isExternalSourcePath('webpack://svc/src/story.ts')).toBe(false);
  });

  it('keeps unmapped generated chunks (they mix user and framework code)', () => {
    expect(isExternalSourcePath('file:///tmp/qpq-federated-code/container/abc123/chunk.js')).toBe(false);
  });
});
