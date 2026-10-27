import { JavascriptRuntimeArchitecture, JavascriptRuntimeVersion, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { aws_lambda } from 'aws-cdk-lib';

const lambdaRuntimeByVersion: Record<JavascriptRuntimeVersion, aws_lambda.Runtime> = {
  [JavascriptRuntimeVersion.Node20]: aws_lambda.Runtime.NODEJS_20_X,
  [JavascriptRuntimeVersion.Node22]: aws_lambda.Runtime.NODEJS_22_X,
  [JavascriptRuntimeVersion.Node24]: aws_lambda.Runtime.NODEJS_24_X,
};

const lambdaArchitectureByArchitecture: Record<JavascriptRuntimeArchitecture, aws_lambda.Architecture> = {
  [JavascriptRuntimeArchitecture.Arm64]: aws_lambda.Architecture.ARM_64,
  [JavascriptRuntimeArchitecture.X86_64]: aws_lambda.Architecture.X86_64,
};

export const getLambdaRuntime = (qpqConfig: QPQConfig): aws_lambda.Runtime => {
  const javascriptRuntimeConfig = qpqCoreUtils.getJavascriptRuntimeConfig(qpqConfig);
  return lambdaRuntimeByVersion[javascriptRuntimeConfig.runtimeVersion];
};

export const getLambdaArchitecture = (qpqConfig: QPQConfig): aws_lambda.Architecture => {
  const javascriptRuntimeConfig = qpqCoreUtils.getJavascriptRuntimeConfig(qpqConfig);
  return lambdaArchitectureByArchitecture[javascriptRuntimeConfig.architecture];
};
