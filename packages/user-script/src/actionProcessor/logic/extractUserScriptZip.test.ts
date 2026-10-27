import { zipSync } from 'fflate';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractUserScriptZip } from './extractUserScriptZip';
import { USER_SCRIPT_SOURCE_LIMITS } from './USER_SCRIPT_SOURCE_LIMITS';
import { UserScriptArchiveError, UserScriptArchiveErrorCode } from './UserScriptArchiveError';

const text = (value: string): Uint8Array => new TextEncoder().encode(value);

const makeZip = (files: Record<string, Uint8Array | [Uint8Array, { attrs?: number }]>): Buffer => Buffer.from(zipSync(files as never));

// A symlink entry: unix mode 0o120777 in the high 16 bits of the external attributes.
const SYMLINK_ATTRS = (0o120777 << 16) >>> 0;

// Rewrites the uncompressed-size field of one entry in both its local header and its
// central directory record, the way a zip bomb understates its payload.
const understateSize = (zip: Buffer, name: string, claimed: number): Buffer => {
  const out = Buffer.from(zip);
  const nameBytes = Buffer.from(name);
  let offset = 0;
  while ((offset = out.indexOf(nameBytes, offset)) !== -1) {
    const localHeader = offset - 30;
    const centralHeader = offset - 46;
    if (localHeader >= 0 && out.readUInt32LE(localHeader) === 0x04034b50) out.writeUInt32LE(claimed, localHeader + 22);
    if (centralHeader >= 0 && out.readUInt32LE(centralHeader) === 0x02014b50) out.writeUInt32LE(claimed, centralHeader + 24);
    offset += nameBytes.length;
  }
  return out;
};

// Sets the "encrypted" general purpose flag (bit 0) on one entry in both its local header and its central
// directory record, the way a password-protected archive marks it.
const markEncrypted = (zip: Buffer, name: string): Buffer => {
  const out = Buffer.from(zip);
  const nameBytes = Buffer.from(name);
  let offset = 0;
  while ((offset = out.indexOf(nameBytes, offset)) !== -1) {
    const localHeader = offset - 30;
    const centralHeader = offset - 46;
    if (localHeader >= 0 && out.readUInt32LE(localHeader) === 0x04034b50) out.writeUInt16LE(out.readUInt16LE(localHeader + 6) | 1, localHeader + 6);
    if (centralHeader >= 0 && out.readUInt32LE(centralHeader) === 0x02014b50)
      out.writeUInt16LE(out.readUInt16LE(centralHeader + 8) | 1, centralHeader + 8);
    offset += nameBytes.length;
  }
  return out;
};

const expectArchiveError = async (promise: Promise<unknown>, code: UserScriptArchiveErrorCode, messagePart: string) => {
  const error = await promise.then(
    () => undefined,
    (caught) => caught,
  );
  expect(error).toBeInstanceOf(UserScriptArchiveError);
  expect((error as UserScriptArchiveError).code).toBe(code);
  expect((error as UserScriptArchiveError).message).toContain(messagePart);
};

let projectDir: string;

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-zip-extract-'));
});

afterEach(() => {
  fs.rmSync(projectDir, { recursive: true, force: true });
});

describe('extractUserScriptZip', () => {
  it('unpacks a project at the zip root, ignoring directory entries', async () => {
    const zip = makeZip({
      'src/': new Uint8Array(0),
      'src/main.ts': text('main'),
      'src/helpers/format.ts': text('helper'),
      'package.json': text('{}'),
    });

    const written = await extractUserScriptZip(zip, projectDir);

    expect(written.sort()).toEqual(['package.json', 'src/helpers/format.ts', 'src/main.ts']);
    expect(fs.readFileSync(path.join(projectDir, 'src', 'helpers', 'format.ts'), 'utf8')).toBe('helper');
  });

  it('strips one top-level folder wrapping the project', async () => {
    const zip = makeZip({ 'my-script/src/main.ts': text('main'), 'my-script/src/helpers/format.ts': text('helper') });

    const written = await extractUserScriptZip(zip, projectDir);

    expect(written.sort()).toEqual(['src/helpers/format.ts', 'src/main.ts']);
    expect(fs.existsSync(path.join(projectDir, 'src', 'main.ts'))).toBe(true);
  });

  it('never strips a root src folder, even when it is the only top-level entry', async () => {
    const zip = makeZip({ 'src/main.ts': text('main') });

    expect(await extractUserScriptZip(zip, projectDir)).toEqual(['src/main.ts']);
  });

  it('does not strip when files sit at the root beside a folder', async () => {
    const zip = makeZip({ 'README.md': text('r'), 'src/main.ts': text('main') });

    expect((await extractUserScriptZip(zip, projectDir)).sort()).toEqual(['README.md', 'src/main.ts']);
  });

  it.each(['../escape.ts', '/etc/passwd', 'src\\main.ts', 'src//main.ts'])('refuses the zip-slip path %j', async (name) => {
    const zip = makeZip({ [name]: text('x') });

    await expectArchiveError(extractUserScriptZip(zip, projectDir), UserScriptArchiveErrorCode.UnsafeArchiveEntry, 'not a plain relative path');
    expect(fs.readdirSync(projectDir)).toEqual([]);
  });

  it('refuses a symlink entry', async () => {
    const zip = makeZip({ 'src/main.ts': text('main'), 'src/link.ts': [text('../../etc/passwd'), { attrs: SYMLINK_ATTRS }] });

    await expectArchiveError(extractUserScriptZip(zip, projectDir), UserScriptArchiveErrorCode.UnsafeArchiveEntry, 'is a symlink');
  });

  // Security regression: an encrypted entry cannot be inspected, so it is refused rather than written as garbage.
  it('refuses an encrypted entry', async () => {
    const zip = markEncrypted(makeZip({ 'src/main.ts': text('main'), 'src/secret.ts': text('x') }), 'src/secret.ts');

    await expectArchiveError(extractUserScriptZip(zip, projectDir), UserScriptArchiveErrorCode.InvalidArchive, 'is encrypted');
  });

  it('refuses a node_modules folder anywhere in the archive', async () => {
    const zip = makeZip({ 'src/main.ts': text('main'), 'src/node_modules/x/index.js': text('x') });

    await expectArchiveError(extractUserScriptZip(zip, projectDir), UserScriptArchiveErrorCode.SourceTooLarge, 'node_modules');
  });

  it('refuses more files than the cap before unpacking anything', async () => {
    const files = Object.fromEntries(Array.from({ length: USER_SCRIPT_SOURCE_LIMITS.maxFiles + 1 }, (_, i) => [`src/f${i}.ts`, text('x')]));

    await expectArchiveError(extractUserScriptZip(makeZip(files), projectDir), UserScriptArchiveErrorCode.SourceTooLarge, 'more than');
    expect(fs.readdirSync(projectDir)).toEqual([]);
  });

  it('refuses more unpacked bytes than the cap, counted as they are written', async () => {
    const zip = makeZip({ 'src/main.ts': new Uint8Array(USER_SCRIPT_SOURCE_LIMITS.maxBytes + 1) });
    expect(zip.length).toBeLessThan(USER_SCRIPT_SOURCE_LIMITS.maxBytes / 10);

    await expectArchiveError(extractUserScriptZip(zip, projectDir), UserScriptArchiveErrorCode.SourceTooLarge, 'unpacks to more than');
  });

  it('refuses an oversized payload whose headers understate its size', async () => {
    const honest = makeZip({ 'src/main.ts': new Uint8Array(USER_SCRIPT_SOURCE_LIMITS.maxBytes + 1) });
    const lying = understateSize(honest, 'src/main.ts', 100);
    expect(lying.equals(honest)).toBe(false);

    await expectArchiveError(extractUserScriptZip(lying, projectDir), UserScriptArchiveErrorCode.SourceTooLarge, 'unpacks to more than');
  });

  it('ignores a header that understates a small entry and writes the real bytes', async () => {
    const lying = understateSize(makeZip({ 'src/main.ts': text('twelve bytes') }), 'src/main.ts', 3);

    expect(await extractUserScriptZip(lying, projectDir)).toEqual(['src/main.ts']);
    expect(fs.readFileSync(path.join(projectDir, 'src', 'main.ts'), 'utf8')).toBe('twelve bytes');
  });

  it('reports something that is not a zip as an invalid archive', async () => {
    await expectArchiveError(
      extractUserScriptZip(Buffer.from('definitely not a zip file'), projectDir),
      UserScriptArchiveErrorCode.InvalidArchive,
      'cannot read',
    );
  });

  it('unpacks an archive with no entry file; the build reports the missing entry', async () => {
    const zip = makeZip({ 'src/other.ts': text('x') });

    expect(await extractUserScriptZip(zip, projectDir)).toEqual(['src/other.ts']);
    expect(fs.existsSync(path.join(projectDir, 'src', 'main.ts'))).toBe(false);
  });
});
