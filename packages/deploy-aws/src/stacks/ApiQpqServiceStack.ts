import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { qpqCoreUtils } from '@qpqjs/core';
import { qpqWebServerUtils } from '@qpqjs/webserver';

import { Construct } from 'constructs';

import {
  ApiQpqWebserverApiConstruct,
  LambdaLayers,
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

export interface ApiQpqServiceStackProps extends QpqServiceStackProps {
  infQpqServiceStack?: InfQpqServiceStack;
}

export class ApiQpqServiceStack extends QpqServiceStack {
  constructor(scope: Construct, id: string, props: ApiQpqServiceStackProps) {
    super(scope, id, props);

    if (props.infQpqServiceStack) {
      this.addDependency(props.infQpqServiceStack);
    }

    // Build Lambda Layers
    const layers = new LambdaLayers(this, 'lambda-layers', {
      qpqConfig: props.qpqConfig,
    });

    // Schedule Events
    qpqCoreUtils.getOwnedScheduleEvents(props.qpqConfig).forEach(
      (setting) =>
        new QpqCoreRecurringScheduleConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          scheduleConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Api - routes
    qpqWebServerUtils.getApiConfigs(props.qpqConfig).forEach(
      (setting) =>
        new ApiQpqWebserverApiConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          apiConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Queues
    qpqCoreUtils.getQueues(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiCoreQueueConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          queueConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Redirects
    qpqWebServerUtils.getSubdomainRedirects(props.qpqConfig).forEach(
      (setting) =>
        new QpqWebserverSubdomainRedirectConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          subdomainRedirectConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Service Functions
    qpqWebServerUtils.getOwnedServiceFunctions(props.qpqConfig).forEach(
      (setting) =>
        new QpqWebserverServiceFunctionConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          serviceFunctionConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // User script runner: the sandbox that askUserScriptExecute hands scripts to
    const userScriptRunnerConfig = qpqCoreUtils.getUserScriptRunner(props.qpqConfig);
    if (userScriptRunnerConfig) {
      new QpqCoreUserScriptRunnerConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(userScriptRunnerConfig), {
        qpqConfig: props.qpqConfig,

        userScriptRunnerConfig,
        apiLayerVersions: layers.layers,
      });
    }

    // Build websocket apis
    qpqWebServerUtils.getOwnedWebsocketSettings(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiWebserverWebsocketConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          websocketConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );
    QpqWebserverWebsocketConstruct.authorizeManageConnectionsForReferencedWebsockets(this, props.qpqConfig);

    // migrations
    qpqCoreUtils.getDeployEventConfigs(props.qpqConfig).forEach(
      (setting) =>
        new QpqCoreDeployEventConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          deployEventConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Storage Drives
    qpqCoreUtils.getStorageDrives(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiCoreStorageDriveConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          storageDriveConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Email receivers: the app's rule in the account's receipt rule set. Here rather than on
    // the Inf stack for the same reason as the drive events: SES validates the bucket and its
    // write policy when the rule is created, and both exist once Inf has deployed.
    qpqWebServerUtils.getEmailReceiverConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqApiWebserverEmailReceiverConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          emailReceiverConfig: setting,
        }),
    );

    // Key value store streams, the projector lambda + event source for any store that
    // declares onStream. Lives here rather than on the Inf stack because that stack builds
    // no lambdas; the stream ARN crosses via SSM (see the construct).
    qpqCoreUtils.getAllKeyValueStores(props.qpqConfig).forEach(
      (setting) =>
        new QpqApiCoreKeyValueStoreStreamConstruct(this, `kvs-stream-${qpqCoreUtils.getUniqueKeyForSetting(setting)}`, {
          qpqConfig: props.qpqConfig,

          keyValueStoreConfig: setting,
          apiLayerVersions: layers.layers,
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
