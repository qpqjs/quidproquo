import { awsNamingUtils } from '@qpqjs/config-aws';
import { ServiceFunctionQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { Construct } from 'constructs';

import { QpqConstructBlock, QpqConstructBlockProps } from '../../../base/QpqConstructBlock';
import { Function } from '../../../basic/Function';

export type QpqWebserverServiceFunctionConstructProps = {
  serviceFunctionConfig: ServiceFunctionQPQWebServerConfigSetting;
} & QpqConstructBlockProps;

export class QpqWebserverServiceFunctionConstruct extends QpqConstructBlock {
  constructor(scope: Construct, id: string, props: QpqWebserverServiceFunctionConstructProps) {
    super(scope, id, props);

    // Build Function
    new Function(this, 'api-function', {
      functionName: this.resourceName(awsNamingUtils.getServiceFunctionLambdaBaseName(props.serviceFunctionConfig.functionName)),
      handler: 'anyExecuteServiceFunctionEvent_serviceFunction',

      timeoutInSeconds: 14.5 * 60,

      reservedConcurrentExecutions: props.serviceFunctionConfig.maxConcurrentExecutions,

      qpqConfig: props.qpqConfig,

      role: this.getServiceRole(),
      virtualNetworkName: props.serviceFunctionConfig.virtualNetworkName,
    });
  }
}
