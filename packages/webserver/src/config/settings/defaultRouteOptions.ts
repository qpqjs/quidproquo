import { QPQConfigSetting } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { RouteOptions } from './route';

export type DefaultRouteOptionsQPQWebServerConfigSetting = {
  routeOptions: RouteOptions;
} & QPQConfigSetting;

export const defineDefaultRouteOptions = (groupName: string, routeOptions: RouteOptions): DefaultRouteOptionsQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.DefaultRouteOptions,
  uniqueKey: groupName,

  routeOptions,
});
