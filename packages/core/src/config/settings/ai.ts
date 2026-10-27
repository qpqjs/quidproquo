import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export interface AiToolDefinition {
  name: string;
  description: string;
  /**
   * Inline function that resolves the tool call server-side. Omit it to declare a
   * client-side tool: the AI loop halts when the model calls it, the pending call is
   * surfaced to the client (e.g. a form on screen), and the client's answer comes
   * back as the next message in the conversation.
   */
  executor?: string;
  inputSchema: Record<string, unknown>;
}

export interface QPQConfigAdvancedAiSettings extends QPQConfigAdvancedSettings {
  tools?: AiToolDefinition[];
  owner?: CrossModuleOwner<'aiName'>;
}

export interface AiQPQConfigSetting extends QPQConfigSetting {
  aiName: string;
  tools: AiToolDefinition[];
}

export const defineAi = (aiName: string, options?: QPQConfigAdvancedAiSettings): AiQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.ai,
  uniqueKey: aiName,

  aiName,

  tools: options?.tools || [],

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
