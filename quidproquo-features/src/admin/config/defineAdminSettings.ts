import {
  AiModel,
  defineDynamicFunctions,
  defineEventBus,
  defineGlobal,
  defineInlineFunction,
  defineKeyValueStore,
  defineNotifyError,
  defineQueue,
  defineServiceSettings,
  defineStorageDrive,
  NotifyErrorQueueEvents,
  QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QPQConfig,
  QPQConfigAdvancedSettings,
  StorageDriveTier,
} from 'quidproquo-core';
import { defineServiceFunction } from 'quidproquo-webserver';

import { defineEventDocSummary } from '../../eventDoc/config/defineEventDocSummary';
import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { defineEventDocRoutes } from '../../eventDoc/routes/defineEventDocRoutes';
import { defineEventDocAi } from '../../eventDocAi';
import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { defineWebSocketQueue } from '../../webSocketQueue';
import { defineAdminServiceActionSearchRoute } from '../actionSearch/config/defineAdminServiceActionSearchRoute';
import { QPQ_LOG_ACTIONS_KVS_NAME, QPQ_LOG_ENTITIES_KVS_NAME, QPQ_LOG_ENTITY_LOOKUP_KVS_NAME } from '../actionSearch/constants';
import { adminLogAiSystemPrompt } from '../constants/adminLogAiSystemPrompt';
import {
  defineAdminServiceAuthRoute,
  defineAdminServiceLogLogRoute,
  defineAdminServiceLogRoute,
  QPQ_STORE_TRACE_RESULT_SERVICE_FUNCTION_NAME,
  QPQ_TRACE_LOG_SERVICE_FUNCTION_NAME,
  WebsocketAdminClientMessageEventType,
} from '../log';
import { QPQ_ADMIN_MAINTENANCE_WS_API_GLOBAL } from '../maintenance/config/maintenanceWebsocketApiGlobal';
import {
  maintenanceBasePath,
  maintenanceDocType,
  maintenanceStoreName,
  QPQ_ADMIN_SERVICE_NAME_GLOBAL,
  QPQ_GET_ACTIVE_MAINTENANCES_FUNCTION_NAME,
  QPQ_MAINTENANCE_ON_APPEND_FN,
  QPQ_MAINTENANCE_WS_SYNC_FN,
} from '../maintenance/constants/maintenanceConstants';
import { adminUserDirectoryResourceName } from './adminUserDirectory';
import { adminLogAiTools, defineAdminLogAiTools } from './defineAdminLogAiTools';
import { defineAdminSessionEventDoc } from './defineAdminSessionEventDoc';

export interface QPQConfigAdvancedLogSettings extends QPQConfigAdvancedSettings {
  logRetentionDays?: number;
  coldStorageAfterDays?: number;

  services?: string[];

  // The APPLICATION websocket api (defineWebSocketQueue apiName) maintenance
  // state broadcasts on. Unset = maintenance mutations skip broadcasting.
  maintenanceWebsocketApiName?: string;
}

// Retention defaults to undefined (no expiry) unless `logRetentionDays` is set.
// If `coldStorageAfterDays` is set, retention is padded by 180 days so logs
// outlive the cold-storage transition window.
const calculateLogRetentionDays = (advancedSettings?: QPQConfigAdvancedLogSettings): number | undefined => {
  if (!advancedSettings?.logRetentionDays) return undefined;
  const coldStorageExtension = (advancedSettings.coldStorageAfterDays ?? 0) > 0 ? advancedSettings.coldStorageAfterDays! + 180 : 0;
  return Math.max(advancedSettings.logRetentionDays, coldStorageExtension);
};

export const defineAdminSettings = (logServiceName: string, advancedSettings?: QPQConfigAdvancedLogSettings): QPQConfig => {
  const routeAuthSettings = {
    routeAuthSettings: {
      userDirectoryName: adminUserDirectoryResourceName,
    },
  };

  const logRetentionDays = calculateLogRetentionDays(advancedSettings);

  return [
    // Owner-stamped resources — materialise as owned on the admin deploy,
    // and as foreign refs elsewhere. Owner resolution runs at IAM-scoping time.
    defineEventBus('qpq-admin-wsq', {
      owner: { module: logServiceName },
    }),

    defineQueue(
      'qpqadmin-wscfg',
      {
        [WebsocketAdminClientMessageEventType.ConfigSyncRequest]: {
          basePath: __dirname,
          functionName: 'onConfigSyncRequest',
          relativePath: 'entry/queue/webSocket',
        },
      },
      {
        eventBusSubscriptions: ['qpq-admin-wsq'],
      },
    ),

    defineWebSocketQueue('qpq-admin-wsq', 'qpqadmin', {
      userDirectoryName: adminUserDirectoryResourceName,
      owner: { module: logServiceName },
    }),

    // App-wide: which module the admin service is, so ANY service (e.g. the app
    // websocket's lambda) can service-function-call it.
    defineGlobal(QPQ_ADMIN_SERVICE_NAME_GLOBAL, logServiceName),

    // The app websocket's connect-time maintenance sync (see
    // defineWebSocketQueue's onConnected — pre-auth, maintenance is public).
    // Registered unowned so it resolves inside whichever service owns the
    // websocket, not just the admin service.
    defineInlineFunction(
      getFeatureEntryQpqFunctionRuntime('admin/maintenance', 'inlineFunction', 'qpqMaintenanceWsConnectedSync::qpqMaintenanceWsConnectedSync'),
      {
        functionName: QPQ_MAINTENANCE_WS_SYNC_FN,
      },
    ),

    // Every service exposes the log-replay tracer as a service function, so the admin
    // log service can trace any log INSIDE the service that owns it (right module
    // loader / federated code store). See trace-replay-plan.md.
    defineServiceFunction(
      {
        basePath: __dirname,
        relativePath: 'entry/serviceFunction/qpqTraceLogExecution',
        functionName: 'qpqTraceLogExecution',
      },
      {
        functionName: QPQ_TRACE_LOG_SERVICE_FUNCTION_NAME,
      },
    ),

    defineStorageDrive(QPQ_LOGS_STORAGE_DRIVE_NAME, {
      owner: { module: logServiceName },
      onEvent: {
        create: getFeatureEntryQpqFunctionRuntime('admin/log', 'storageDrive', 'onCreate::onCreate'),
      },
      deprecated: advancedSettings?.deprecated,
      lifecycleRules: [
        {
          transitions:
            (advancedSettings?.coldStorageAfterDays ?? 0) > 0
              ? [
                  {
                    storageDriveTier: StorageDriveTier.DEEP_COLD_STORAGE,
                    transitionAfterDays: advancedSettings!.coldStorageAfterDays!,
                  },
                ]
              : undefined,
          deleteAfterDays: logRetentionDays,
        },
      ],
    }),

    // Admin-only resources — only flatten out when the deploying service is the log service.
    defineServiceSettings({
      [logServiceName]: [
        defineStorageDrive(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, {
          deprecated: advancedSettings?.deprecated,
          lifecycleRules: [{ deleteAfterDays: 30 }],
        }),

        defineKeyValueStore(QPQ_LOGS_STORAGE_DRIVE_NAME, 'correlation', [], {
          indexes: [
            { partitionKey: 'runtimeType', sortKey: 'startedAt' },
            { partitionKey: 'fromCorrelation', sortKey: 'startedAt' },
          ],
          ttlAttribute: 'ttl',
          deprecated: advancedSettings?.deprecated,
        }),

        defineKeyValueStore('qpq-log-messages', 'correlationId', ['timestamp']),

        // The reply channel for async traces: owning services send finished traces
        // here; this stores them and pushes a TraceDone websocket message to admins.
        defineServiceFunction(getFeatureEntryQpqFunctionRuntime('admin/log', 'serviceFunction', 'traceStore::qpqStoreTraceResult'), {
          functionName: QPQ_STORE_TRACE_RESULT_SERVICE_FUNCTION_NAME,
        }),

        defineKeyValueStore(`${QPQ_LOGS_STORAGE_DRIVE_NAME}-list`, { key: 'type', type: 'number' }, ['timestamp'], {
          deprecated: advancedSettings?.deprecated,
        }),

        // Action search: per-action rows extracted at log ingestion, keyed for
        // idempotent re-ingestion; linkKey groups rows into domain entities.
        defineKeyValueStore(QPQ_LOG_ACTIONS_KVS_NAME, 'correlation', [{ key: 'actionIndex', type: 'number' }], {
          indexes: [
            { partitionKey: 'actionType', sortKey: 'startedAt' },
            { partitionKey: 'linkKey', sortKey: 'startedAt' },
          ],
          ttlAttribute: 'ttl',
          deprecated: advancedSettings?.deprecated,
        }),

        defineKeyValueStore(QPQ_LOG_ENTITIES_KVS_NAME, 'linkKey', [], {
          indexes: [{ partitionKey: 'entityType', sortKey: 'createdAt' }],
          ttlAttribute: 'ttl',
          deprecated: advancedSettings?.deprecated,
        }),

        defineKeyValueStore(QPQ_LOG_ENTITY_LOOKUP_KVS_NAME, 'lookupKey', ['sortValue'], {
          ttlAttribute: 'ttl',
          deprecated: advancedSettings?.deprecated,
        }),

        defineAdminServiceAuthRoute('POST', '/login', 'login'),
        defineAdminServiceAuthRoute('POST', '/refreshToken', 'refreshToken'),
        defineAdminServiceAuthRoute('POST', '/challenge', 'respondToAuthChallenge'),

        defineAdminServiceLogLogRoute('POST', '/loglog/list', 'getLogLogs', routeAuthSettings),

        defineAdminServiceLogRoute('GET', '/admin/services', 'getServiceNames'),
        defineAdminServiceLogRoute('POST', '/log/list', 'getLogs', routeAuthSettings),
        defineAdminServiceLogRoute('GET', '/log/{correlationId}', 'getLog', routeAuthSettings),
        defineAdminServiceLogRoute('GET', '/log/{correlationId}/toggle', 'toggleLogCheck', routeAuthSettings),
        defineAdminServiceLogRoute('GET', '/log/children/{fromCorrelation}', 'getChildren', routeAuthSettings),
        defineAdminServiceLogRoute('GET', '/log/{correlationId}/hierarchies', 'getHierarchies', routeAuthSettings),
        defineAdminServiceLogRoute('GET', '/log/downloadurl/{correlationId}', 'downloadUrl', routeAuthSettings),
        defineAdminServiceLogRoute('POST', '/log/{correlationId}/trace', 'traceLog', routeAuthSettings),

        defineAdminServiceActionSearchRoute('POST', '/actionSearch/actions/list', 'listActionRows', routeAuthSettings),
        defineAdminServiceActionSearchRoute('POST', '/actionSearch/entities/list', 'listEntityRows', routeAuthSettings),
        defineAdminServiceActionSearchRoute('POST', '/actionSearch/entity/timeline', 'getEntityTimeline', routeAuthSettings),

        // The maintenance event doc: active = open draft, closed = published,
        // reopen = new draft. Every append re-broadcasts the active public folds
        // over the application websocket (onAppend hook below). The definition is
        // registered as the collection's functions object: the append derives the
        // hook's before/after states through its fold (see askEventDocHookStates),
        // and the stream projector snapshots maintenance docs like any other
        // collection.
        defineDynamicFunctions(eventDocFunctionsName(maintenanceStoreName, maintenanceDocType), {
          basePath: __dirname,
          relativePath: '../maintenance/eventDoc/maintenanceEventDoc',
          functionName: 'maintenanceEventDoc',
        }),
        defineEventDocSummary(maintenanceStoreName, {
          snapshotFunctions: { [maintenanceDocType]: eventDocFunctionsName(maintenanceStoreName, maintenanceDocType) },
        }),
        defineEventDocRoutes({
          storeName: maintenanceStoreName,
          type: maintenanceDocType,
          basePath: maintenanceBasePath,
          routeAuthSettings: { userDirectoryName: adminUserDirectoryResourceName },
          onAppend: QPQ_MAINTENANCE_ON_APPEND_FN,
        }),

        defineInlineFunction(
          getFeatureEntryQpqFunctionRuntime('admin/maintenance', 'inlineFunction', 'qpqMaintenanceOnAppend::qpqMaintenanceOnAppend'),
          {
            functionName: QPQ_MAINTENANCE_ON_APPEND_FN,
          },
        ),

        // The cross-service read of the active maintenance folds — the websocket
        // lambda's connect-time sync calls this.
        defineServiceFunction(
          getFeatureEntryQpqFunctionRuntime('admin/maintenance', 'serviceFunction', 'qpqGetActiveMaintenances::qpqGetActiveMaintenances'),
          {
            functionName: QPQ_GET_ACTIVE_MAINTENANCES_FUNCTION_NAME,
          },
        ),

        // The log chat: a generic EventDocAi instance scoped to `docId` = log correlation id,
        // with tools instead of the log pasted into the prompt (see adminLogAiSystemPrompt).
        defineEventDocAi({
          storeName: 'log',
          type: 'log',
          serviceName: logServiceName,
          eventBusName: 'qpq-admin-wsq',
          userDirectoryName: adminUserDirectoryResourceName,
          model: AiModel.ClaudeSonnet46,
          systemPrompt: adminLogAiSystemPrompt,
          tools: adminLogAiTools,
        }),
        defineAdminLogAiTools(),

        defineQueue(
          'qpq-admin-websockets',
          {
            [WebsocketAdminClientMessageEventType.MarkLogChecked]: getFeatureEntryQpqFunctionRuntime(
              'admin/log',
              'queueEvent',
              'webSocket::onMarkLogChecked',
            ),
            [WebsocketAdminClientMessageEventType.RefreshLogMetadata]: getFeatureEntryQpqFunctionRuntime(
              'admin/log',
              'queueEvent',
              'webSocket::onRefreshLogMetadata',
            ),
          },
          {
            eventBusSubscriptions: ['qpq-admin-wsq'],
          },
        ),

        defineEventBus('admin-notifier'),
        defineNotifyError('admin-notifier', {
          onAlarm: {
            publishToEventBus: ['admin-notifier'],
          },
        }),
        defineQueue(
          'admin-alarms',
          {
            [NotifyErrorQueueEvents.Error]: getFeatureEntryQpqFunctionRuntime('admin/log', 'queueEvent', 'alarm::onError'),
            [NotifyErrorQueueEvents.Timeout]: getFeatureEntryQpqFunctionRuntime('admin/log', 'queueEvent', 'alarm::onTimeout'),
            [NotifyErrorQueueEvents.Throttle]: getFeatureEntryQpqFunctionRuntime('admin/log', 'queueEvent', 'alarm::onThrottle'),
          },
          {
            eventBusSubscriptions: ['admin-notifier'],
          },
        ),

        defineGlobal(QPQ_ADMIN_MAINTENANCE_WS_API_GLOBAL, advancedSettings?.maintenanceWebsocketApiName ?? ''),
        defineGlobal('qpq-serviceNames', advancedSettings?.services ?? []),
        defineGlobal('qpq-log-retention-days', logRetentionDays),
        defineGlobal('qpq-log-service-name', logServiceName),
      ],
    }),

    // The admin UI's audited session event doc — one doc per login.
    ...defineAdminSessionEventDoc(logServiceName),
  ];
};
