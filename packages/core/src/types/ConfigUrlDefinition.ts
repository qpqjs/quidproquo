export type ConfigUrlDefinition = {
  protocol: 'http' | 'https';
  domain: string;
  path?: string;
  module?: string;
};

export type ConfigUrl = ConfigUrlDefinition | string;
