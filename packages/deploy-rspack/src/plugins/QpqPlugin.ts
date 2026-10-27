import { QPQConfig } from 'quidproquo-core';

import path from 'path';
import type { Compiler, RspackPluginInstance } from '@rspack/core';

import { getQpqDynamicLoaderSrcFromQpqConfigs } from './getQpqDynamicLoaderSrcFromQpqConfigs';

type QpqPluginOptions = {
  qpqConfigs: QPQConfig[];
  nodeModulePath: string;
  aliases?: Record<string, string>;

  // Bundle every service's story code even for thin shells (bundleFallback: false).
  // Set by the dev-server build: thin shells only exist to keep lambda zips small,
  // and the dev server always runs code from the local source instead.
  alwaysBundleStoryCode?: boolean;
};

export class QpqPlugin implements RspackPluginInstance {
  private options: QpqPluginOptions;

  constructor(options: QpqPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler): void {
    const dynamicLoaderPath = path.resolve(this.options.nodeModulePath, 'quidproquo-dynamic-loader.js');

    // Alias the bare specifier the framework imports ('quidproquo-dynamic-loader') to the
    // virtual module below, so resolution doesn't depend on nodeModulePath being on the
    // importing file's node_modules chain. App-supplied aliases can still override it.
    compiler.options.resolve = compiler.options.resolve || {};
    compiler.options.resolve.alias = {
      'quidproquo-dynamic-loader': dynamicLoaderPath,
      ...((compiler.options.resolve.alias as Record<string, string>) || {}),
      ...this.options.aliases,
    };

    // Take the plugin class from the COMPILER's own rspack instance, not this
    // package's import: under npm link the two can be different physical copies of
    // @rspack/core, and a virtual module registered on the wrong instance's binding
    // is invisible to the build ("Cannot find module" on the aliased key).
    new compiler.rspack.experiments.VirtualModulesPlugin({
      [dynamicLoaderPath]: getQpqDynamicLoaderSrcFromQpqConfigs(this.options.qpqConfigs, this.options.alwaysBundleStoryCode),
    }).apply(compiler);
  }
}
