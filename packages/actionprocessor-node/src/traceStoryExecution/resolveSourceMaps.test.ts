import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { addSegment, GenMapping, toEncodedMap } from '@jridgewell/gen-mapping';

import { filterOwnCodeLocations, getOwnCodeMarkersFromRoot } from './resolveSourceMaps';

// Mirrors the dev server's bundle layout: every hosted service plus the whole framework
// (aliased to workspace src/, never node_modules) lands in ONE script. A source map with
// three "statements" - the traced service's own code, a sibling service, and a framework
// package - stands in for that script; none of framework/sibling paths contain
// 'node_modules', so the plain heuristic alone can't separate them from the traced story.
const fixtureDirectory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-trace-ownmarkers-test-')));

afterAll(() => {
  fs.rmSync(fixtureDirectory, { recursive: true, force: true });
});

const OWN_SOURCE = 'webpack://app/./apps/myapp/services/admin/service/src/entry/story.ts';
const SIBLING_SERVICE_SOURCE = 'webpack://app/./apps/myapp/services/auth/service/src/entry/story.ts';
const FRAMEWORK_SOURCE = 'webpack://app/./quidproquo-core/src/qpqExecuteLog.ts';
const NODE_MODULES_SOURCE = 'webpack://app/./node_modules/some-dep/index.js';

const writeFixtureScript = (): string => {
  const scriptPath = path.join(fixtureDirectory, 'main.js');
  const mapPath = path.join(fixtureDirectory, 'main.js.map');

  const map = new GenMapping({ file: 'main.js' });
  addSegment(map, 0, 0, OWN_SOURCE, 0, 0);
  addSegment(map, 1, 0, SIBLING_SERVICE_SOURCE, 0, 0);
  addSegment(map, 2, 0, FRAMEWORK_SOURCE, 0, 0);
  addSegment(map, 3, 0, NODE_MODULES_SOURCE, 0, 0);

  fs.writeFileSync(mapPath, JSON.stringify(toEncodedMap(map)));
  fs.writeFileSync(scriptPath, 'line0;\nline1;\nline2;\nline3;\n//# sourceMappingURL=main.js.map\n');

  return scriptPath;
};

const ALL_LOCATIONS = [
  { lineNumber: 0, columnNumber: 0 }, // own service
  { lineNumber: 1, columnNumber: 0 }, // sibling service (dev-server bundles every hosted service)
  { lineNumber: 2, columnNumber: 0 }, // framework, aliased to workspace src/ (not node_modules)
  { lineNumber: 3, columnNumber: 0 }, // real node_modules dependency
];

describe('filterOwnCodeLocations', () => {
  it('without ownCodeMarkers, only excludes node_modules - framework and sibling-service code leak through', () => {
    // This is the pre-fix dev-server bug: bundling the framework from workspace src/
    // instead of node_modules defeats the only heuristic onlyOwnCode had.
    const scriptPath = writeFixtureScript();

    const kept = filterOwnCodeLocations(scriptPath, ALL_LOCATIONS);

    expect(kept).toEqual([ALL_LOCATIONS[0], ALL_LOCATIONS[1], ALL_LOCATIONS[2]]);
  });

  it("with ownCodeMarkers, narrows down to just the traced service's own code", () => {
    const scriptPath = writeFixtureScript();
    const ownCodeMarkers = getOwnCodeMarkersFromRoot('/repo/apps/myapp/services/admin/service/src');

    const kept = filterOwnCodeLocations(scriptPath, ALL_LOCATIONS, ownCodeMarkers);

    expect(kept).toEqual([ALL_LOCATIONS[0]]);
  });
});

describe('getOwnCodeMarkersFromRoot', () => {
  it('derives markers that match both real filesystem paths and webpack pseudo-paths for the same root', () => {
    const markers = getOwnCodeMarkersFromRoot('/repo/apps/myapp/services/admin/service/src');

    expect(markers).toContain('/repo/apps/myapp/services/admin/service/src');
    expect(markers.some((marker) => OWN_SOURCE.includes(marker))).toBe(true);
    expect(markers.some((marker) => SIBLING_SERVICE_SOURCE.includes(marker))).toBe(false);
    expect(markers.some((marker) => FRAMEWORK_SOURCE.includes(marker))).toBe(false);
  });

  it('handles windows-style backslash roots', () => {
    const markers = getOwnCodeMarkersFromRoot('E:\\repo\\apps\\myapp\\services\\admin\\service\\src');

    expect(markers.some((marker) => OWN_SOURCE.includes(marker))).toBe(true);
  });
});
