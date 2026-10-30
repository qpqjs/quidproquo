import { ActionProcessorsQPQConfigSetting, defineActionProcessors } from '@qpqjs/core';

/**
 * Registers the askUserScriptBuild processor on a service. Only services that call this
 * can build user scripts, and only they load rspack; on lambda they also need the layer
 * from getUserScriptBuilderApiLayer.
 */
export const defineUserScriptBuilder = (): ActionProcessorsQPQConfigSetting =>
  defineActionProcessors({
    basePath: __dirname,
    relativePath: '../actionProcessor/getUserScriptBuilderActionProcessor',
    functionName: 'getUserScriptBuilderActionProcessor',
  });
