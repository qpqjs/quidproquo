import fs from 'fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'path';
import yauzl, { Entry, ZipFile } from 'yauzl';

import { isSafeProjectPath } from './isSafeProjectPath';
import { USER_SCRIPT_SOURCE_LIMITS } from './USER_SCRIPT_SOURCE_LIMITS';
import { UserScriptArchiveError, UserScriptArchiveErrorCode } from './UserScriptArchiveError';

const REFUSED_DIRECTORY = 'node_modules';
const SYMLINK_MODE = 0o120000;
const FILE_TYPE_MASK = 0o170000;

// Unix mode lives in the high 16 bits of the external attributes; zips made on other
// systems leave it zero, which reads as "not a symlink".
const isSymlinkEntry = (entry: Entry): boolean => ((entry.externalFileAttributes >>> 16) & FILE_TYPE_MASK) === SYMLINK_MODE;

// With decodeStrings off, yauzl hands names over raw so it does not apply its own path
// rules before ours.
const entryName = (entry: Entry): string => (Buffer.isBuffer(entry.fileName) ? entry.fileName.toString('utf8') : String(entry.fileName));

const isDirectoryEntry = (name: string): boolean => name.endsWith('/');

const openZip = (zip: Buffer): Promise<ZipFile> =>
  new Promise((resolve, reject) => {
    // Header sizes are never consulted: the byte cap on the inflated stream is the only
    // authority, so yauzl's own size validation is off rather than a second, trusted, rule.
    yauzl.fromBuffer(zip, { lazyEntries: true, decodeStrings: false, validateEntrySizes: false }, (error, zipFile) =>
      error ? reject(error) : resolve(zipFile),
    );
  });

const readEntries = (zipFile: ZipFile, onEntry: (entry: Entry) => Promise<void> | void): Promise<void> =>
  new Promise((resolve, reject) => {
    zipFile.on('error', reject);
    zipFile.on('end', resolve);
    zipFile.on('entry', (entry: Entry) => {
      // A rule that throws synchronously must still reject here, not escape yauzl's
      // event emitter where it would be lost and leave the zip hanging.
      Promise.resolve()
        .then(() => onEntry(entry))
        .then(
          () => zipFile.readEntry(),
          (error) => {
            zipFile.close();
            reject(error);
          },
        );
    });
    zipFile.readEntry();
  });

const openEntryStream = (zipFile: ZipFile, entry: Entry): Promise<Readable> =>
  new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => (error ? reject(error) : resolve(stream)));
  });

const tooLarge = (message: string): UserScriptArchiveError => new UserScriptArchiveError(UserScriptArchiveErrorCode.SourceTooLarge, message);
const unsafe = (message: string): UserScriptArchiveError => new UserScriptArchiveError(UserScriptArchiveErrorCode.UnsafeArchiveEntry, message);
const invalid = (message: string): UserScriptArchiveError => new UserScriptArchiveError(UserScriptArchiveErrorCode.InvalidArchive, message);

// Counts the bytes that really come out of the inflater and fails the pipeline the moment
// the project cap is crossed, so a zip that lies about its sizes cannot fill the disk.
const createByteCap = (counter: { total: number }, onExceeded: () => Error): Transform =>
  new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      counter.total += chunk.length;
      if (counter.total > USER_SCRIPT_SOURCE_LIMITS.maxBytes) {
        callback(onExceeded());
        return;
      }
      callback(null, chunk);
    },
  });

type PlannedEntry = { entry: Entry; relativePath: string };

// Accepts the project at the zip root (anything under `src/`), or wrapped in exactly one
// top-level folder (how most tools zip a directory): when nothing is under `src/` at the
// root, every file shares the same first segment, and none sits at the root, that segment
// is stripped. A root `src/` always wins, so a project with only `src/` is never stripped.
const stripCommonFolder = (names: string[]): number => {
  if (names.length === 0 || names.some((name) => name.startsWith('src/'))) return 0;

  const firstSegments = new Set(names.map((name) => name.split('/')[0]));
  const allNested = names.every((name) => name.includes('/'));

  return firstSegments.size === 1 && allNested ? [...firstSegments][0].length + 1 : 0;
};

const planEntries = async (zip: Buffer): Promise<PlannedEntry[]> => {
  const files: PlannedEntry[] = [];
  const zipFile = await openZip(zip);

  await readEntries(zipFile, (entry) => {
    const name = entryName(entry);
    if (isDirectoryEntry(name)) return;

    if (entry.isEncrypted()) throw invalid(`entry [${name}] is encrypted`);
    if (isSymlinkEntry(entry)) throw unsafe(`entry [${name}] is a symlink`);
    if (!isSafeProjectPath(name)) throw unsafe(`entry [${name}] is not a plain relative path inside the project`);
    if (name.split('/').includes(REFUSED_DIRECTORY)) {
      throw tooLarge(`entry [${name}] is inside a ${REFUSED_DIRECTORY} folder; dependencies are not supported in a user script yet`);
    }

    files.push({ entry, relativePath: name });
    if (files.length > USER_SCRIPT_SOURCE_LIMITS.maxFiles) {
      throw tooLarge(`the archive holds more than ${USER_SCRIPT_SOURCE_LIMITS.maxFiles} files`);
    }
  });

  const strip = stripCommonFolder(files.map((file) => file.relativePath));

  return files.map((file) => ({ ...file, relativePath: file.relativePath.slice(strip) }));
};

/**
 * Unpacks a user-controlled zip into the project directory under the same rules as a
 * directory build: plain relative paths only, no symlinks, no node_modules, at most
 * USER_SCRIPT_SOURCE_LIMITS files and unpacked bytes counted as they are written (the
 * sizes in the zip's headers are never trusted). Directory entries are ignored; folders
 * come from file paths. Returns the project-relative paths written.
 */
export const extractUserScriptZip = async (zip: Buffer, projectDir: string): Promise<string[]> => {
  let planned: PlannedEntry[];
  try {
    planned = await planEntries(zip);
  } catch (error) {
    if (error instanceof UserScriptArchiveError) throw error;
    throw invalid(`cannot read the archive: ${error instanceof Error ? error.message : String(error)}`);
  }

  const counter = { total: 0 };
  const written: string[] = [];
  const zipFile = await openZip(zip);
  const plannedByEntryName = new Map(planned.map((file) => [entryName(file.entry), file.relativePath]));

  try {
    await readEntries(zipFile, async (entry) => {
      const relativePath = plannedByEntryName.get(entryName(entry));
      if (relativePath === undefined) return;

      const target = path.join(projectDir, ...relativePath.split('/'));
      fs.mkdirSync(path.dirname(target), { recursive: true });

      const stream = await openEntryStream(zipFile, entry);
      await pipeline(
        stream,
        createByteCap(counter, () => tooLarge(`the archive unpacks to more than ${USER_SCRIPT_SOURCE_LIMITS.maxBytes} bytes`)),
        fs.createWriteStream(target),
      );
      written.push(relativePath);
    });
  } catch (error) {
    if (error instanceof UserScriptArchiveError) throw error;
    throw invalid(`cannot unpack the archive: ${error instanceof Error ? error.message : String(error)}`);
  }

  return written;
};
