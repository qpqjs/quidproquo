import { Nullable, QPQConfig, qpqCoreUtils, QpqFunctionRuntime, QpqRuntimeType } from 'quidproquo-core';

import { getKvsStreamEventProcessor } from '../actionProcessor/core/event/kvsStream';
import { KvsStreamMessageWithSession } from '../actionProcessor/core/event/kvsStream/types';
import { eventBus, KVS_STREAM_EVENT_TOPIC, processEvent, trackInFlight } from '../logic';
import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../types';

const getDynamicModuleLoader = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return async (runtime: QpqFunctionRuntime): Promise<any> => devServerConfig.dynamicModuleLoader(serviceName, runtime);
};

/**
 * Runs stream handlers for local key-value store writes, mirroring queueImplementation.
 *
 * Only the service that OWNS the store runs its handler, or every service loaded into the dev
 * server would project the same change once each.
 *
 * A failing handler is logged, never rethrown: deployed, the stream sits downstream of a
 * committed write and a broken projector cannot roll it back, so failing the write locally
 * would be a difference that only shows up on dev.
 */
export const kvsStreamImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<Nullable<DevServerPluginStop>> => {
  const runStreamHandlers = async (message: KvsStreamMessageWithSession): Promise<void> => {
    for (const qpqConfig of devServerConfig.qpqConfigs) {
      const ownsStore = qpqCoreUtils.getOwnedKeyValueStores(qpqConfig).some((store) => store.keyValueStoreName === message.record.keyValueStoreName);

      if (!ownsStore) {
        continue;
      }

      try {
        await processEvent<KvsStreamMessageWithSession, void>(
          message,
          qpqConfig,
          getDynamicModuleLoader(qpqConfig, devServerConfig),
          getKvsStreamEventProcessor,
          QpqRuntimeType.KVS_STREAM_EVENT,
          (event) => event.storySession,
          devServerConfig,
        );
      } catch (error) {
        console.error(`[kvs-stream] handler failed for ${message.record.keyValueStoreName}:`, error);
      }
    }
  };

  // Tracked, because a projection is work the write has already been told
  // succeeded: without this a shutdown kills it silently, and `qpq migrate`
  // never waits for the projections its own migrations trigger. trackInFlight
  // is called synchronously here, before any await, so a shutdown starting in
  // this same tick still sees the work.
  eventBus.on(KVS_STREAM_EVENT_TOPIC, (message: KvsStreamMessageWithSession) => {
    void trackInFlight(runStreamHandlers(message));
  });

  return null;
};
