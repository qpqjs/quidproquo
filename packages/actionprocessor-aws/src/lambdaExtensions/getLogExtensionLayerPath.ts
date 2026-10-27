import path from 'path';

/**
 * Absolute path to the built qpq-log-extension layer directory (contains the
 * `extensions/` folder). Produced by scripts/buildLogExtensionLayer.mjs and
 * shipped under lib/extension-layer. Used by the CDK layer construct as the
 * LayerVersion asset source.
 *
 * Resolved relative to this compiled file: lib/<format>/lambdaExtensions/<this>
 * -> ../../extension-layer.
 */
export const getLogExtensionLayerPath = (): string => {
  return path.resolve(__dirname, '..', '..', 'extension-layer');
};
