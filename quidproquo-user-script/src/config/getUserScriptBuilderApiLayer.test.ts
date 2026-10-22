import path from 'path';
import { describe, expect, it } from 'vitest';

import { getUserScriptBuilderApiLayer } from './getUserScriptBuilderApiLayer';
import { getUserScriptBuilderLayerDir } from './getUserScriptBuilderLayerDir';

describe('getUserScriptBuilderApiLayer', () => {
  it('names the layer, points at the package-owned layer directory, and externalises rspack and its binding', () => {
    const layerDir = getUserScriptBuilderLayerDir();

    expect(path.isAbsolute(layerDir)).toBe(true);
    expect(layerDir).toBe(path.join(path.resolve(__dirname, '..', '..'), 'layer', 'user-script-builder'));
    expect(getUserScriptBuilderApiLayer()).toEqual({
      name: 'user-script-builder',
      buildPath: layerDir,
      modules: ['@rspack/core', '@rspack/binding'],
    });
  });
});
