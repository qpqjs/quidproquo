import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { qpqCoreUtils } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

import { Construct } from 'constructs';

import {
  ApiQpqWebserverApiConstruct,
  QpqApiCoreKeyValueStoreStreamConstruct,
  QpqApiCoreQueueConstruct,
  QpqApiCoreStorageDriveConstruct,
  QpqApiWebserverEmailReceiverConstruct,
  QpqApiWebserverWebsocketConstruct,
  QpqConfigAwsAlarmConstruct,
  QpqConfigAwsDashboardConstruct,
  QpqCoreDeployEventConstruct,
  QpqCoreNotifyErrorConstruct,
  QpqCoreRecurringScheduleConstruct,
  QpqCoreUserScriptRunnerConstruct,
  QpqWebserverServiceFunctionConstruct,
  QpqWebserverSubdomainRedirectConstruct,
  QpqWebserverWebsocketConstruct,
} from '../constructs';
import { QpqServiceStack, QpqServiceStackProps } from './base/QpqServiceStack';
import { InfQpqServiceStack } from './InfQpqServiceStack';

export type ApiQpqServiceStackProps = {
  infQpqServiceStack?: InfQpqServiceStack;
} & QpqServiceStackProps;

export class ApiQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: ApiQpqServiceStackProps) {
    super(scope, id, props);

    if (props.infQpqServiceStack) {
      this.addDependency(props.infQpqServiceStack);
    }

    // Schedule Events
    qpqCoreUtils.getOwnedScheduleEvents(props.qpqConfig).forEach(
      (setting) =>
        new QpqCoreRecurringScheduleConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          scheduleConfig: setting,
        }),
    );

    // Api - routes
    qpqWebServerUtils.getAllApiConfigs(props.qpqConfig).forEach(
      (setting) =>
        new ApiQpqWebserverApiConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          apiConfig: setting,
        }),
    );

    // Queues
    qpqCoreUtils.getAllQueueConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiCoreQueueConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          queueConfig: setting,
        }),
    );

    // Redirects
    qpqWebServerUtils.getSubdomainRedirects(props.qpqConfig).forEach(
      (setting) =>
        new QpqWebserverSubdomainRedirectConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          subdomainRedirectConfig: setting,
        }),
    );

    // Service Functions
    qpqWebServerUtils.getOwnedServiceFunctions(props.qpqConfig).forEach(
      (setting) =>
        new QpqWebserverServiceFunctionConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          serviceFunctionConfig: setting,
        }),
    );

    // User script runner: the sandbox that askUserScriptExecute hands scripts to
    const userScriptRunnerConfig = qpqCoreUtils.getUserScriptRunnerConfig(props.qpqConfig);
    if (userScriptRunnerConfig) {
      new QpqCoreUserScriptRunnerConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(userScriptRunnerConfig), {
        qpqConfig: props.qpqConfig,

        userScriptRunnerConfig,
      });
    }

    // Build websocket apis
    qpqWebServerUtils.getOwnedWebsocketConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiWebserverWebsocketConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          websocketConfig: setting,
        }),
    );
    QpqWebserverWebsocketConstruct.authorizeManageConnectionsForReferencedWebsockets(this, props.qpqConfig);

    // migrations
    qpqCoreUtils.getDeployEventConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqCoreDeployEventConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          deployEventConfig: setting,
        }),
    );

    // Storage Drives
    qpqCoreUtils.getAllStorageDriveConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiCoreStorageDriveConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          storageDriveConfig: setting,
        }),
    );

    // Email receivers: the app's rule in the account's receipt rule set. Here rather than on
    // the Inf stack for the same reason as the drive events: SES validates the bucket and its
    // write policy when the rule is created, and both exist once Inf has deployed.
    qpqWebServerUtils.getAllEmailReceiverConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqApiWebserverEmailReceiverConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          emailReceiverConfig: setting,
        }),
    );

    // Key value store streams, the projector lambda + event source for any store that
    // declares onStream. Lives here rather than on the Inf stack because that stack builds
    // no lambdas; the stream ARN crosses via SSM (see the construct).
    qpqCoreUtils.getAllKeyValueStoreConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiCoreKeyValueStoreStreamConstruct(this, `kvs-stream-${qpqCoreUtils.getUniqueKeyForSetting(setting)}`, {
          qpqConfig: props.qpqConfig,

          keyValueStoreConfig: setting,
        }),
    );

    // alarms
    // create alarms inside the api stack because we want sns topics to be already made
    qpqConfigAwsUtils.getOwnedAwsAlarmConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqConfigAwsAlarmConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          alarmConfig: setting,
        }),
    );

    qpqCoreUtils.getNotifyErrorConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqCoreNotifyErrorConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          notifyErrorConfig: setting,
        }),
    );

    // Operational dashboard (+ latency/duration anomaly detection) - built here in the
    // api phase where all the service's metric-emitting resources exist
    const dashboardConfig = qpqConfigAwsUtils.getAwsServiceDashboardConfig(props.qpqConfig);
    if (dashboardConfig) {
      new QpqConfigAwsDashboardConstruct(this, 'dashboard', {
        qpqConfig: props.qpqConfig,

        dashboardConfig,
      });
    }
  }
}
