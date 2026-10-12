import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { EVENT_DOC_COLLECTION_CONFIG_SETTING_TYPE } from '../../eventDoc/constants/eventDocCollectionConfigSettingType';
import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { EventDocCollectionQPQConfigSetting } from '../../eventDoc/types/EventDocCollectionQPQConfigSetting';
import { EVENT_DOC_AI_CONFIG_SETTING_TYPE } from '../../eventDocAi/constants/eventDocAiConfigSettingType';
import { EventDocAiQPQConfigSetting } from '../../eventDocAi/types/EventDocAiQPQConfigSetting';
import { McpEventDocAi } from '../models/McpEventDocAi';

/** Every eventDoc AI in the service, joined with its collection's store and its defineAi tools. */
export const buildMcpEventDocAis = (qpqConfig: QPQConfig): McpEventDocAi[] => {
  const collections = qpqCoreUtils.getConfigSettings<EventDocCollectionQPQConfigSetting>(qpqConfig, EVENT_DOC_COLLECTION_CONFIG_SETTING_TYPE);
  const aiConfigs = qpqCoreUtils.getAllAiConfigs(qpqConfig);

  return qpqCoreUtils.getConfigSettings<EventDocAiQPQConfigSetting>(qpqConfig, EVENT_DOC_AI_CONFIG_SETTING_TYPE).map((ai): McpEventDocAi => ({
    aiName: ai.aiName,
    serviceName: ai.serviceName,
    type: ai.type,
    // A collection mounted without defineEventDocRoutes has no registration, and so no hooks to run.
    store:
      collections.find(({ store }) => store.storeName === ai.storeName && store.type === ai.type)?.store ??
      buildEventDocStore({ storeName: ai.storeName, type: ai.type }),
    tools: aiConfigs.find((aiConfig) => aiConfig.aiName === ai.aiName)?.tools ?? [],
  }));
};
