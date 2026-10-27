import { QPQConfig } from 'quidproquo-core';
import { getWebAddressing, WebAddressingPorts } from 'quidproquo-dev-server';

/** Env var the views build reads to bake `WebAddressing` into every bundle. */
export const QPQ_WEB_ADDRESSING_ENV = 'QPQ_WEB_ADDRESSING';

/** Bakes port-mode addressing into the views builds that follow, until `clearWebAddressingEnv`. */
export const setWebAddressingEnv = (qpqConfigs: QPQConfig[], ports: WebAddressingPorts): void => {
  process.env[QPQ_WEB_ADDRESSING_ENV] = JSON.stringify(getWebAddressing(qpqConfigs, ports));
};

export const clearWebAddressingEnv = (): void => {
  delete process.env[QPQ_WEB_ADDRESSING_ENV];
};
