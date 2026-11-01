import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOutput } from './out';

describe('createOutput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes a single line', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    createOutput('setup').log('hello');

    expect(log).toHaveBeenCalledWith('[qpq:setup] hello');
  });

  it('prefixes every non-empty line and keeps blank lines blank', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    createOutput('deploy').log('\n\nRunning automated deploy\n\n');
    createOutput('deploy').log('Unknown app.\nValid apps: a, b');

    expect(log).toHaveBeenNthCalledWith(1, '\n\n[qpq:deploy] Running automated deploy\n\n');
    expect(log).toHaveBeenNthCalledWith(2, '[qpq:deploy] Unknown app.\n[qpq:deploy] Valid apps: a, b');
  });

  it('prints an empty string as a blank line, not a lone prefix', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    createOutput('setup').log('');

    expect(log).toHaveBeenCalledWith('');
  });

  it('keeps a non-string first argument as its own argument after the prefix', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('boom');

    createOutput('go').error(failure);

    expect(error).toHaveBeenCalledWith('[qpq:go]', failure);
  });

  it('rewrites a row above the cursor with the prefix kept', () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    createOutput('dev').rewriteLineAbove(3, '  http://localhost:3000  shell  (started)');

    expect(write).toHaveBeenCalledWith('\x1b[3F\x1b[2K[qpq:dev]   http://localhost:3000  shell  (started)\x1b[3E');
  });
});
