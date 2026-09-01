import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { Construct } from 'constructs';

import {
  ApiQpqWebserverApiConstruct,
  LambdaLayers,
  QpqApiCoreKeyValueStoreStreamConstruct,
  QpqApiCoreQueueConstruct,
  QpqApiCoreStorageDriveConstruct,
  QpqApiWebserverWebsocketConstruct,
  QpqConfigAwsAlarmConstruct,
  QpqConfigAwsDashboardConstruct,
  QpqCoreDeployEventConstruct,
  QpqCoreNotifyErrorConstruct,
  QpqCoreRecurringScheduleConstruct,
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

    // Add the inf stack as a dependency so it builds first
    if (props.infQpqServiceStack) {
      this.addDependency(props.infQpqServiceStack);
    }

    // Build Lambda Layers
    const layers = new LambdaLayers(this, 'lambda-layers', {
      qpqConfig: props.qpqConfig,
    });

    // Schedule Events
    const scheduleEvent = qpqCoreUtils.getOwnedScheduleEvents(props.qpqConfig).map(
      (setting) =>
        new QpqCoreRecurringScheduleConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          scheduleConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Api - routes
    const apis = qpqWebServerUtils.getApiConfigs(props.qpqConfig).map(
      (setting) =>
        new ApiQpqWebserverApiConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          apiConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Queues
    const queues = qpqCoreUtils.getQueues(props.qpqConfig).map(
      (setting) =>
        new QpqApiCoreQueueConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          queueConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Redirects
    const redirects = qpqWebServerUtils.getSubdomainRedirects(props.qpqConfig).map(
      (setting) =>
        new QpqWebserverSubdomainRedirectConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          subdomainRedirectConfig: setting,
        }),
    );

    // Service Functions
    const serviceFunctions = qpqWebServerUtils.getOwnedServiceFunctions(props.qpqConfig).map(
      (setting) =>
        new QpqWebserverServiceFunctionConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          serviceFunctionConfig: setting,
          apiLayerVersions: layers.layers,
        }),
    );

    // Build websocket apis
    const websockets = qpqWebServerUtils.getOwnedWebsocketSettings(props.qpqConfig).map(
      (setting) =>
        new QpqApiWebserverWebsocketConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          websocketConfig: setting,
        }),
    );
    QpqWebserverWebsocketConstruct.authorizeManageConnectionsForReferencedWebsockets(this, props.qpqConfig);

    // migrations
    const deployEvents = qpqCoreUtils.getDeployEventConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqCoreDeployEventConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          deployEventConfig: setting,
        }),
    );

    // Storage Drives
    const storageDrives = qpqCoreUtils.getStorageDrives(props.qpqConfig).map(
      (setting) =>
        new QpqApiCoreStorageDriveConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          storageDriveConfig: setting,
        }),
    );

    // Key value store streams — the projector lambda + event source for any store that
    // declares onStream. Lives here rather than on the Inf stack because that stack builds
    // no lambdas; the stream ARN crosses via SSM (see the construct).
    const keyValueStoreStreams = qpqCoreUtils.getAllKeyValueStores(props.qpqConfig).map(
      (setting) =>
        new QpqApiCoreKeyValueStoreStreamConstruct(this, `kvs-stream-${qpqCoreUtils.getUniqueKeyForSetting(setting)}`, {
          qpqConfig: props.qpqConfig,

          keyValueStoreConfig: setting,
        }),
    );

    // alarms
    // create alarms inside the api stack because we want sns topics to be already made
    const alarms = qpqConfigAwsUtils.getOwnedAwsAlarmConfigs(props.qpqConfig).map(
      (setting) =>
        new QpqConfigAwsAlarmConstruct(this, qpqCoreUtils.getUniqueKeyForSetting(setting), {
          qpqConfig: props.qpqConfig,

          alarmConfig: setting,
        }),
    );

    const notifyErrors = qpqCoreUtils.getNotifyErrorConfigs(props.qpqConfig).map(
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
