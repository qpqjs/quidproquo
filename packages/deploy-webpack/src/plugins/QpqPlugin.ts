import { QPQConfig } from 'quidproquo-core';

import path from 'path';
import { Compiler, WebpackPluginInstance } from 'webpack';
import VirtualModulesPlugin from 'webpack-virtual-modules';

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

export class QpqPlugin implements WebpackPluginInstance {
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

    // webpack itself ships no virtual-modules plugin, so unlike QpqWebPlugin's
    // DefinePlugin (taken from compiler.webpack for npm-link safety) this one
    // has to come from the third-party webpack-virtual-modules package.
    new VirtualModulesPlugin({
      [dynamicLoaderPath]: getQpqDynamicLoaderSrcFromQpqConfigs(this.options.qpqConfigs, this.options.alwaysBundleStoryCode),
    }).apply(compiler);
  }
}
