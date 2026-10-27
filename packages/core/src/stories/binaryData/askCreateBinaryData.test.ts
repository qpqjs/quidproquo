import { describe, expect, it } from 'vitest';

import { runStory } from '../../testing/storyTesting';
import { askCreateTextQpqBinaryData, TextFileType } from './askCreateBinaryData';

describe('askCreateTextQpqBinaryData', () => {
  it('base64-encodes the text and maps the file type to a mimetype', () => {
    const result = runStory(askCreateTextQpqBinaryData('{"a":1}', 'data.json', TextFileType.Json));

    expect(result).toEqual({
      base64Data: Buffer.from('{"a":1}', 'utf-8').toString('base64'),
      filename: 'data.json',
      mimetype: 'application/json',
    });
  });

  it('picks the mimetype for each text file type', () => {
    expect(runStory(askCreateTextQpqBinaryData('hi', 'a.txt', TextFileType.PlainText)).mimetype).toBe('text/plain');
    expect(runStory(askCreateTextQpqBinaryData('# hi', 'a.md', TextFileType.Markdown)).mimetype).toBe('text/markdown');
  });

  it('encodes an empty string', () => {
    expect(runStory(askCreateTextQpqBinaryData('', 'empty.txt', TextFileType.PlainText)).base64Data).toBe('');
  });

  it('encodes multibyte UTF-8 text identically to Buffer', () => {
    const text = 'héllo wörld 🎉 日本語';

    const result = runStory(askCreateTextQpqBinaryData(text, 'utf8.txt', TextFileType.PlainText));

    expect(result.base64Data).toBe(Buffer.from(text, 'utf-8').toString('base64'));
  });
});
