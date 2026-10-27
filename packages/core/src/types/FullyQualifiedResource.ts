export type CustomFullyQualifiedResource<T extends string> = {
  module: string;
  application: string;
  feature: string;
  environment: string;
} & {
  [key in T]: string;
};

export type FullyQualifiedResource = CustomFullyQualifiedResource<'resourceName'>;
