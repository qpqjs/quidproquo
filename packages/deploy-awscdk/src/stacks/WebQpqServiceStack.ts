import { qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { Construct } from 'constructs';

import { WebQpqWebserverDomainProxyConstruct, WebQpqWebserverWebEntryConstruct } from '../constructs';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';
import { InfQpqServiceStack } from './InfQpqServiceStack';

export interface WebQpqServiceStackProps extends QpqServiceStackProps {
  infQpqServiceStack?: InfQpqServiceStack;
}

export class WebQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: WebQpqServiceStackProps) {
    super(scope, id, props);

    // Add the inf stack as a dependency so it builds first
    if (props.infQpqServiceStack) {
      this.addDependency(props.infQpqServiceStack);
    }

    // Web entries
    const webEntries = qpqWebServerUtils.getWebEntryConfigs(props.qpqConfig).map(
      (setting) =>
        new WebQpqWebserverWebEntryConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          webEntryConfig: setting,
        }),
    );

    const domainProxies = qpqWebServerUtils.getDomainProxyConfigs(props.qpqConfig).map(
      (setting) =>
        new WebQpqWebserverDomainProxyConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          domainProxyConfig: setting,
        }),
    );
  }
}
