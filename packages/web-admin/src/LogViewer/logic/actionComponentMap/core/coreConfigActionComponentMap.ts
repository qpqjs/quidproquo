import { ConfigActionType } from 'quidproquo-core';

const coreConfigActionComponentMap: Record<string, string[]> = {
  [ConfigActionType.GetApplicationInfo]: ['askConfigGetApplicationInfo'],
  [ConfigActionType.GetGlobal]: ['askConfigGetGlobal', 'globalName'],
  [ConfigActionType.GetParameter]: ['askConfigGetParameter', 'parameterName'],
  [ConfigActionType.GetParameters]: ['askConfigGetParameters', 'parameterNames'],
  [ConfigActionType.GetSecret]: ['askConfigGetSecret', 'secretName'],
  [ConfigActionType.SetParameter]: ['askConfigSetParameter', 'parameterName', 'parameterValue'],
  [ConfigActionType.ListParameters]: ['askConfigListParameters'],
};

export default coreConfigActionComponentMap;
