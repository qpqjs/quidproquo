import { QPQConfig, QPQConfigAdvancedSettings } from 'quidproquo-core';
import { defineServiceFunction } from 'quidproquo-webserver';

import path from 'path';

export interface QPQConfigAdvancedDevServerSettings extends QPQConfigAdvancedSettings {
  onlyDeploySafe?: boolean;
  vpcList?: string[];
}

export const defineDevServerConfig = (advancedSettings?: QPQConfigAdvancedDevServerSettings): QPQConfig => {
  const onlyDeploySafe = advancedSettings?.onlyDeploySafe ?? true;
  const vpcList: string[] = advancedSettings?.vpcList || [];

  const graphAccessConfigs = vpcList.map((vpcName) =>
    defineServiceFunction(
      {
        basePath: __dirname,
        relativePath: '../../entry/serviceFunction/runCypherQuery',
        functionName: 'runCypherQuery',
      },
      {
        virtualNetworkName: vpcName,
        functionName: `graphQuery${vpcName}`,
      },
    ),
  );

  const alwaysSafeConfigs: QPQConfig = [...graphAccessConfigs];
  const notSafeConfigs: QPQConfig = [];

  return [...(!onlyDeploySafe ? notSafeConfigs : []), ...alwaysSafeConfigs];
};
