import { qpqCoreUtils } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

import { Construct } from 'constructs';

import { WebQpqWebserverDomainProxyConstruct, WebQpqWebserverWebEntryConstruct } from '../constructs';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';
import { InfQpqServiceStack } from './InfQpqServiceStack';

export type WebQpqServiceStackProps = {
  infQpqServiceStack?: InfQpqServiceStack;
} & QpqServiceStackProps;

export class WebQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: WebQpqServiceStackProps) {
    super(scope, id, props);

    if (props.infQpqServiceStack) {
      this.addDependency(props.infQpqServiceStack);
    }

    // Web entries
    qpqWebServerUtils.getWebEntryConfigs(props.qpqConfig).forEach(
      (setting) =>
        new WebQpqWebserverWebEntryConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          webEntryConfig: setting,
        }),
    );

    qpqWebServerUtils.getDomainProxyConfigs(props.qpqConfig).forEach(
      (setting) =>
        new WebQpqWebserverDomainProxyConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          domainProxyConfig: setting,
        }),
    );
  }
}
