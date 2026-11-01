import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { createScratchBuildRoot } from './createScratchBuildRoot';

describe('createScratchBuildRoot', () => {
  it('creates one build folder per handler and an extension layer folder, and removes them all', () => {
    const root = createScratchBuildRoot(['apiGatewayEventHandler_api', 'queueEvent_jobs'], 'qpq-scratch-test-');

    expect(path.basename(root.configRoot).startsWith('qpq-scratch-test-')).toBe(true);
    expect(fs.statSync(path.join(root.configRoot, 'build', 'apiGatewayEventHandler_api')).isDirectory()).toBe(true);
    expect(fs.statSync(path.join(root.configRoot, 'build', 'queueEvent_jobs')).isDirectory()).toBe(true);
    expect(fs.statSync(root.extensionLayerPath).isDirectory()).toBe(true);
    expect(fs.readdirSync(root.extensionLayerPath)).toEqual([]);

    root.remove();

    expect(fs.existsSync(root.configRoot)).toBe(false);
  });
});
