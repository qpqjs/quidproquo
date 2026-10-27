// Minimal input-source-map loader (replaces the rspack `source-map-loader` package).
//
// Applied (enforce: 'pre') to .js files so source maps emitted by COMPILED
// dependencies (org libs shipping .js + .js.map from tsc) chain into the build's
// output map, letting execution traces show the original TS instead of tsc output.
//
// Scope is deliberately the tsc-output case the framework needs:
//   - `//# sourceMappingURL=<file>.map` next to the source file
//   - inline `data:application/json;base64,...` (and URI-encoded) maps
// Anything else (http(s) URLs, missing/unreadable/unparseable maps) passes the
// source through untouched - the module simply stays as-is in traces, exactly the
// behaviour source-map-loader + our ignoreWarnings config produced.
import { Nullable } from 'quidproquo-core';

import fs from 'fs';
import path from 'path';
import type { LoaderContext } from '@rspack/core';

// Last sourceMappingURL comment in the file, line (`//`) or block (`/* */`) form.
const SOURCE_MAPPING_URL_REGEX = /(?:\/\/[#@][ \t]*sourceMappingURL=([^\s'"]+)[ \t]*$|\/\*[#@][ \t]*sourceMappingURL=([^\s'"*]+)[ \t]*\*\/)/gm;

// The parts of the standard source-map JSON shape this loader touches; nulls
// mirror the spec (a source with no retrievable content is null).
type RawSourceMap = {
  sources?: (string | null)[];
  sourcesContent?: (string | null)[];
  sourceRoot?: string;
  [key: string]: unknown;
};

const readDataUrlMap = (url: string): Nullable<string> => {
  const match = /^data:(?:[^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/i.exec(url);
  if (!match) {
    return null;
  }

  const [, isBase64, data] = match;
  return isBase64 ? Buffer.from(data, 'base64').toString('utf8') : decodeURIComponent(data);
};

// tsc without inlineSources emits maps whose `sources` point back at the .ts files;
// embed their text when it's on disk so traces carry full source, mirroring
// source-map-loader. Sources that can't be read stay null (file/line still map).
const fillSourcesContent = (map: RawSourceMap, mapDirectory: string, addDependency: (file: string) => void): void => {
  if (!Array.isArray(map.sources) || map.sources.length === 0) {
    return;
  }

  const sourcesContent = Array.isArray(map.sourcesContent) ? [...map.sourcesContent] : [];
  const sourceRoot = typeof map.sourceRoot === 'string' ? map.sourceRoot : '';

  map.sources.forEach((source, index) => {
    if (sourcesContent[index] != null || typeof source !== 'string' || /^[a-z][a-z0-9+.-]*:/i.test(source)) {
      return;
    }

    const sourcePath = path.resolve(mapDirectory, path.join(sourceRoot, source));
    try {
      sourcesContent[index] = fs.readFileSync(sourcePath, 'utf8');
      addDependency(sourcePath);
    } catch {
      sourcesContent[index] = sourcesContent[index] ?? null;
    }
  });

  map.sourcesContent = sourcesContent;
};

export default function sourceMapLoader(this: LoaderContext, content: string): void {
  const callback = this.async();

  const matches = [...content.matchAll(SOURCE_MAPPING_URL_REGEX)];
  const lastMatch = matches[matches.length - 1];
  if (!lastMatch) {
    callback(null, content);
    return;
  }

  const url = lastMatch[1] || lastMatch[2];
  const resourceDirectory = path.dirname(this.resourcePath);

  let rawMap: Nullable<string> = null;
  let mapDirectory = resourceDirectory;

  if (url.startsWith('data:')) {
    rawMap = readDataUrlMap(url);
  } else if (!/^https?:\/\//i.test(url)) {
    const mapPath = path.resolve(resourceDirectory, decodeURIComponent(url));
    try {
      rawMap = fs.readFileSync(mapPath, 'utf8');
      mapDirectory = path.dirname(mapPath);
      this.addDependency(mapPath);
    } catch {
      rawMap = null;
    }
  }

  if (rawMap === null) {
    callback(null, content);
    return;
  }

  let map: RawSourceMap;
  try {
    map = JSON.parse(rawMap);
  } catch {
    callback(null, content);
    return;
  }

  fillSourcesContent(map, mapDirectory, (file) => this.addDependency(file));

  // Strip the comment so downstream tooling doesn't chase a map we already consumed.
  const contentWithoutComment = content.slice(0, lastMatch.index) + content.slice(lastMatch.index + lastMatch[0].length);

  callback(null, contentWithoutComment, map as never);
}
