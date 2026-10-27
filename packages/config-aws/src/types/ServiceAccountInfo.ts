export type ServiceAccountInfo = {
  moduleName: string;

  applicationName?: string;
  environment?: string;
  feature?: string;

  awsAccountId: string;
  awsRegion: string;
};

export type LocalServiceAccountInfo = Required<Omit<ServiceAccountInfo, 'feature'>> & Pick<ServiceAccountInfo, 'feature'>;
