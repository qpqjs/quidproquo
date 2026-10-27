import { ApplicationConfigInfo, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import type { Compiler, WebpackPluginInstance } from 'webpack';

type QpqWebPluginOptions = {
  qpqConfig: QPQConfig;
};

export class QpqWebPlugin implements WebpackPluginInstance {
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

    // From the compiler's own webpack instance: under npm link this package's
    // 'webpack' import can be a different physical copy than the build's, and a
    // plugin from the wrong copy misbehaves silently.
    new compiler.webpack.DefinePlugin({
      [`process.env.QPQ_APPLICATION_CONFIG_INFO_${serviceName.toUpperCase()}`]: JSON.stringify(applicationConfigInfo),
      'process.env.QPQ_APPLICATION_CONFIG_INFO': JSON.stringify(applicationConfigInfo),
    }).apply(compiler);
  }
}
