// Post-processing: map the controller's raw steps (generated script positions) back to
// original sources via the .map files sitting next to the traced scripts on disk —
// the same files the federated store syncs to /tmp alongside the code. When a map
// carries sourcesContent (the federated remote build embeds it), the original source
// text is embedded in the trace so viewers need no access to the repo.

import { QpqExecutionTraceSource, QpqExecutionTraceStep, QpqExecutionTraceValue } from 'quidproquo-core';

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { originalPositionFor, sourceContentFor, TraceMap } from '@jridgewell/trace-mapping';

interface RawTraceStep {
  scriptId: string;
  line: number; // 0-based (CDP)
  column: number;
  functionName: string;
  locals: Record<string, QpqExecutionTraceValue>;
  returnValue?: QpqExecutionTraceValue;
}

const scriptUrlToPath = (scriptUrl: string): string => (scriptUrl.startsWith('file://') ? fileURLToPath(scriptUrl) : scriptUrl);

// The LAST sourceMappingURL comment wins (bundles can contain earlier ones from inlined
// third-party code).
const findSourceMappingUrl = (scriptText: string): string | null => {
  const matches = scriptText.match(/\/\/[#@] sourceMappingURL=(\S+)/g);
  if (!matches || matches.length === 0) return null;
  return matches[matches.length - 1].replace(/\/\/[#@] sourceMappingURL=/, '');
};

const loadTraceMap = (scriptPath: string): TraceMap | null => {
  try {
    const scriptText = fs.readFileSync(scriptPath, 'utf8');
    const sourceMappingUrl = findSourceMappingUrl(scriptText);
    if (!sourceMappingUrl) return null;

    if (sourceMappingUrl.startsWith('data:')) {
      const base64Match = sourceMappingUrl.match(/^data:application\/json[^,]*;base64,(.*)$/);
      const json = base64Match
        ? Buffer.from(base64Match[1], 'base64').toString('utf8')
        : decodeURIComponent(sourceMappingUrl.replace(/^data:[^,]*,/, ''));
      return new TraceMap(json);
    }

    const mapPath = path.resolve(path.dirname(scriptPath), sourceMappingUrl);
    return new TraceMap(fs.readFileSync(mapPath, 'utf8'));
  } catch {
    // No map is a degraded trace, not a failure — generated positions still tell the story
    return null;
  }
};

// Which candidate breakpoint positions land in the service's OWN code — answers the
// controller worker's filterLocations request when onlyOwnCode tracing is on (the eval
// worker can't load trace-mapping itself). Positions mapping into node_modules
// (framework/deps) or not mapping at all (webpack runtime glue) are dropped. No map
// means the bundle can't be classified — everything stays traced.
//
// ownCodeMarkers is a second, opt-in signal: substrings identifying the traced story's
// own source root. The node_modules check alone assumes framework/deps are bundled from
// real node_modules — true for lambda's federated remotes, but not for hosts (the dev
// server) that bundle workspace framework packages from source alongside every hosted
// service in one script, where framework code never lands in node_modules either. When
// markers are given, a location must ALSO map into one of them to count as own code.
export const filterOwnCodeLocations = <TLocation extends { lineNumber: number; columnNumber?: number }>(
  scriptUrl: string,
  locations: TLocation[],
  ownCodeMarkers?: string[],
): TLocation[] => {
  const traceMap = scriptUrl ? loadTraceMap(scriptUrlToPath(scriptUrl)) : null;
  if (!traceMap) {
    return locations;
  }

  return locations.filter((location) => {
    const original = originalPositionFor(traceMap, { line: location.lineNumber + 1, column: location.columnNumber ?? 0 });
    if (!original.source || original.source.includes('node_modules')) return false;

    return !ownCodeMarkers?.length || ownCodeMarkers.some((marker) => original.source!.includes(marker));
  });
};

// Derives own-code markers from a service's absolute source root (QpqFunctionRuntimeAdvanced.basePath,
// or getApplicationConfigRoot(qpqConfig) for the relative-string runtime form). Bundlers emit
// source-map `source` entries as either real filesystem paths or webpack://<namespace>/./<path
// relative to the build context> pseudo urls — both preserve the original directory names
// verbatim, so matching on the root's own trailing segments works for either form without
// needing to know the bundler's exact context/namespace.
export const getOwnCodeMarkersFromRoot = (root: string): string[] => {
  const normalized = root.replace(/\\/g, '/').replace(/\/+$/, '');
  const tailSegments = normalized.split('/').filter(Boolean).slice(-3).join('/');

  return tailSegments && tailSegments !== normalized ? [normalized, tailSegments] : [normalized];
};

export interface ResolvedTraceSteps {
  sources: QpqExecutionTraceSource[];
  steps: QpqExecutionTraceStep[];
}

export const resolveSourceMappedSteps = (rawSteps: RawTraceStep[], scriptUrlsById: Record<string, string>): ResolvedTraceSteps => {
  const traceMapsByScriptId = new Map<string, TraceMap | null>();
  const sourceIndexByPath = new Map<string, number>();
  const sources: QpqExecutionTraceSource[] = [];

  const getTraceMap = (scriptId: string): TraceMap | null => {
    if (!traceMapsByScriptId.has(scriptId)) {
      const scriptUrl = scriptUrlsById[scriptId];
      traceMapsByScriptId.set(scriptId, scriptUrl ? loadTraceMap(scriptUrlToPath(scriptUrl)) : null);
    }
    return traceMapsByScriptId.get(scriptId) ?? null;
  };

  const getSourceIndex = (sourcePath: string, content?: string): number => {
    const existing = sourceIndexByPath.get(sourcePath);
    if (existing !== undefined) return existing;

    const index = sources.length;
    sources.push(content !== undefined ? { path: sourcePath, content } : { path: sourcePath });
    sourceIndexByPath.set(sourcePath, index);
    return index;
  };

  // Unmapped fallback: the generated script itself becomes the source, content included
  // so the viewer can still render something.
  const getGeneratedSourceIndex = (scriptId: string): number => {
    const scriptUrl = scriptUrlsById[scriptId] || scriptId;
    const existing = sourceIndexByPath.get(scriptUrl);
    if (existing !== undefined) return existing;

    let content: string | undefined;
    try {
      content = fs.readFileSync(scriptUrlToPath(scriptUrl), 'utf8');
    } catch {
      content = undefined;
    }
    return getSourceIndex(scriptUrl, content);
  };

  const steps = rawSteps.map((rawStep): QpqExecutionTraceStep => {
    const traceMap = getTraceMap(rawStep.scriptId);

    if (traceMap) {
      const original = originalPositionFor(traceMap, { line: rawStep.line + 1, column: rawStep.column });
      if (original.source) {
        const content = sourceContentFor(traceMap, original.source) ?? undefined;
        return {
          sourceIndex: getSourceIndex(original.source, content),
          line: original.line ?? rawStep.line + 1,
          column: original.column ?? rawStep.column,
          functionName: rawStep.functionName,
          locals: rawStep.locals,
          returnValue: rawStep.returnValue,
        };
      }
    }

    return {
      sourceIndex: getGeneratedSourceIndex(rawStep.scriptId),
      line: rawStep.line + 1,
      column: rawStep.column,
      functionName: rawStep.functionName,
      locals: rawStep.locals,
      returnValue: rawStep.returnValue,
    };
  });

  return { sources, steps };
};
