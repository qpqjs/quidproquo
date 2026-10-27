import { QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { RouteOptions } from './route';

export interface DefaultRouteOptionsQPQWebServerConfigSetting extends QPQConfigSetting {
  routeOptions: RouteOptions;
}

export const defineDefaultRouteOptions = (groupName: string, routeOptions: RouteOptions): DefaultRouteOptionsQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.DefaultRouteOptions,
  uniqueKey: groupName,

  routeOptions,
});
