import { describe, expect, it } from 'vitest';

import { createSplitMergedReasoningTransform, ModelStreamPart } from './createSplitMergedReasoningTransform';

const signature = (value: string) => ({ bedrock: { signature: value } });

const run = async (parts: ModelStreamPart[]): Promise<ModelStreamPart[]> => {
  const source = new ReadableStream<ModelStreamPart>({
    start(controller) {
      parts.forEach((part) => controller.enqueue(part));
      controller.close();
    },
  });

  const out: ModelStreamPart[] = [];
  const reader = source.pipeThrough(createSplitMergedReasoningTransform()).getReader();
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    out.push(next.value);
  }

  return out;
};

describe('createSplitMergedReasoningTransform', () => {
  it('passes a single reasoning block through untouched', async () => {
    const parts: ModelStreamPart[] = [
      { type: 'reasoning-start', id: '0' },
      { type: 'reasoning-delta', id: '0', delta: 'first thought' },
      { type: 'reasoning-delta', id: '0', delta: '', providerMetadata: signature('sig-1') },
      { type: 'reasoning-end', id: '0' },
    ];

    expect(await run(parts)).toEqual(parts);
  });

  it('starts a new part for reasoning that follows a signature under the same id', async () => {
    expect(
      await run([
        { type: 'reasoning-start', id: '0' },
        { type: 'reasoning-delta', id: '0', delta: 'first thought' },
        { type: 'reasoning-delta', id: '0', delta: '', providerMetadata: signature('sig-1') },
        { type: 'reasoning-delta', id: '0', delta: 'second thought' },
        { type: 'reasoning-delta', id: '0', delta: '', providerMetadata: signature('sig-2') },
        { type: 'reasoning-end', id: '0' },
      ]),
    ).toEqual([
      { type: 'reasoning-start', id: '0' },
      { type: 'reasoning-delta', id: '0', delta: 'first thought' },
      { type: 'reasoning-delta', id: '0', delta: '', providerMetadata: signature('sig-1') },
      { type: 'reasoning-end', id: '0' },
      { type: 'reasoning-start', id: '0:1' },
      { type: 'reasoning-delta', id: '0:1', delta: 'second thought' },
      { type: 'reasoning-delta', id: '0:1', delta: '', providerMetadata: signature('sig-2') },
      { type: 'reasoning-end', id: '0:1' },
    ]);
  });

  it('splits a second block that is only a signature, and a third after it', async () => {
    const out = await run([
      { type: 'reasoning-start', id: '0' },
      { type: 'reasoning-delta', id: '0', delta: 'first thought' },
      { type: 'reasoning-delta', id: '0', delta: '', providerMetadata: signature('sig-1') },
      { type: 'reasoning-delta', id: '0', delta: '', providerMetadata: signature('sig-2') },
      { type: 'reasoning-delta', id: '0', delta: 'third thought' },
      { type: 'reasoning-delta', id: '0', delta: '', providerMetadata: signature('sig-3') },
      { type: 'reasoning-end', id: '0' },
    ]);

    expect(out.filter((part) => part.type === 'reasoning-start').map((part) => part.id)).toEqual(['0', '0:1', '0:2']);
    expect(out.filter((part) => part.type === 'reasoning-end').map((part) => part.id)).toEqual(['0', '0:1', '0:2']);
  });

  it('keeps blocks under different ids apart, and reads a signature under any provider name', async () => {
    const out = await run([
      { type: 'reasoning-start', id: '0' },
      { type: 'reasoning-delta', id: '0', delta: 'a', providerMetadata: { amazonBedrock: { signature: 'sig-1' } } },
      { type: 'reasoning-end', id: '0' },
      { type: 'reasoning-start', id: '2' },
      { type: 'reasoning-delta', id: '2', delta: 'b' },
      { type: 'reasoning-delta', id: '2', delta: '', providerMetadata: signature('sig-2') },
      { type: 'reasoning-delta', id: '2', delta: 'c' },
      { type: 'reasoning-end', id: '2' },
    ]);

    expect(out.filter((part) => part.type === 'reasoning-start').map((part) => part.id)).toEqual(['0', '2', '2:1']);
  });

  it('leaves every other kind of part alone', async () => {
    const parts: ModelStreamPart[] = [
      { type: 'text-start', id: '1' },
      { type: 'text-delta', id: '1', delta: 'hello' },
      { type: 'text-end', id: '1' },
    ];

    expect(await run(parts)).toEqual(parts);
  });
});
