import { createActionRequester } from '../../types';
import { ConfigActionType } from './ConfigActionType';

export type ApplicationConfigInfo = {
  name: string;
  environment: string;
  module: string;
  feature?: string;
};

export const askConfigGetApplicationInfo = createActionRequester<ApplicationConfigInfo>()({
  actionType: ConfigActionType.GetApplicationInfo,
});
