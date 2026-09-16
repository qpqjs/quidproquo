import { describe, expect, it } from 'vitest';

import { mapEncodedJson } from './mapEncodedJson';

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64');
const upperStrings = (container: unknown): unknown => JSON.parse(JSON.stringify(container).replace(/v(\d)/g, 'V$1'));

describe('mapEncodedJson', () => {
  it('applies the text transform to every leaf and the container transform at every decoded level', () => {
    const input = {
      plain: 'v0',
      json: JSON.stringify({ a: 'v1', inner: b64({ b: 'v2' }) }),
      b64: b64({ c: 'v3', innerJson: JSON.stringify({ d: 'v4' }) }),
    };

    const result = mapEncodedJson(input, upperStrings, (t) => `text:${t}`);

    expect(result.plain).toBe('text:v0');
    const json = JSON.parse(result.json);
    expect(json.a).toBe('text:V1');
    expect(JSON.parse(Buffer.from(json.inner, 'base64').toString())).toEqual({ b: 'text:V2' });
    const decoded = JSON.parse(Buffer.from(result.b64, 'base64').toString());
    expect(decoded.c).toBe('text:V3');
    expect(JSON.parse(decoded.innerJson)).toEqual({ d: 'text:V4' });
  });

  it('unwraps base64 form bodies and writes them back as base64 form bodies', () => {
    const input = { body: Buffer.from('username=joe&password=v1').toString('base64') };

    const result = mapEncodedJson(input, upperStrings);

    expect(Buffer.from(result.body, 'base64').toString()).toBe('username=joe&password=V1');
  });

  it('applies the text transform inside base64 plain text, re-encoding only when it changed', () => {
    const changed = { note: Buffer.from('just some words v1').toString('base64') };
    const unchanged = { note: Buffer.from('just some words').toString('base64') };

    expect(Buffer.from(mapEncodedJson(changed, upperStrings, (t) => t.replace('v1', 'V1')).note, 'base64').toString()).toBe('just some words V1');
    expect(mapEncodedJson(unchanged, upperStrings, (t) => t.replace('v1', 'V1'))).toEqual(unchanged);
    expect(mapEncodedJson(changed, upperStrings)).toEqual(changed);
  });
});
