import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { entryNames, getLambdaEntries } from './getLambdaEntries';

describe('getLambdaEntries', () => {
  it('maps every entry name to a path under ./lambdas', () => {
    const entries = getLambdaEntries();

    expect(Object.keys(entries).sort()).toEqual([...entryNames].sort());
    for (const name of entryNames) {
      expect(entries[name]).toContain(`lambdas/${name}`);
    }
  });

  it('exposes the api gateway and sqs entry points', () => {
    expect(entryNames).toContain('apiGatewayEventHandler');
    expect(entryNames).toContain('sqsEvent_queueEvent');
  });

  // Bundlers resolve these paths at deploy time; a rename in ./lambdas that misses
  // this list would only surface as a broken deploy build.
  it('has a lambda source file for every entry name', () => {
    for (const name of entryNames) {
      expect(existsSync(path.join(__dirname, 'lambdas', `${name}.ts`)), `missing lambda source for entry ${name}`).toBe(true);
    }
  });

  // ...and the other direction, which is the one that actually bit: a NEW handler added to
  // ./lambdas but not listed here is never bundled, so the deploy fails at synth with
  // "Cannot find asset" pointing at a path nothing ever built.
  it('has an entry name for every lambda source file', () => {
    const sources = readdirSync(path.join(__dirname, 'lambdas'))
      .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
      .map((file) => path.parse(file).name);

    for (const source of sources) {
      expect(entryNames, `lambdas/${source}.ts is not in entryNames, so it will never be bundled`).toContain(source);
    }
  });
});
