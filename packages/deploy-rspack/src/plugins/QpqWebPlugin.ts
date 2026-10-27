import { ApplicationConfigInfo, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import type { Compiler, RspackPluginInstance } from '@rspack/core';

type QpqWebPluginOptions = {
  qpqConfig: QPQConfig;
};

export class QpqWebPlugin implements RspackPluginInstance {
  private options: QpqWebPluginOptions;

  constructor(options: QpqWebPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler): void {
    const applicationName = qpqCoreUtils.getApplicationName(this.options.qpqConfig);
    const environment = qpqCoreUtils.getApplicationModuleEnvironment(this.options.qpqConfig);
    const feature = qpqCoreUtils.getApplicationModuleFeature(this.options.qpqConfig);
    const serviceName = qpqCoreUtils.getApplicationModuleName(this.options.qpqConfig);

    const applicationConfigInfo: ApplicationConfigInfo = {
      environment: environment,
      module: serviceName,
      name: applicationName,
      feature: feature,
    };

    console.log('Applying QpqWebPlugin with config:', applicationConfigInfo);

    // From the compiler's own rspack instance - see QpqPlugin for why (npm link
    // can make this package's @rspack/core a different copy than the build's).
    new compiler.rspack.DefinePlugin({
      [`process.env.QPQ_APPLICATION_CONFIG_INFO_${serviceName.toUpperCase()}`]: JSON.stringify(applicationConfigInfo),
      'process.env.QPQ_APPLICATION_CONFIG_INFO': JSON.stringify(applicationConfigInfo),
    }).apply(compiler);
  }
}
