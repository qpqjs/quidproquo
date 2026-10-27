export type CrossModuleOwner<T extends string = 'resourceNameOverride'> = {
  module?: string;
  application?: string;
  feature?: string;
  environment?: string;
} & {
  [key in T]?: string;
};

export type CrossModuleOwnerWithNoResourceOverride = Omit<CrossModuleOwner, 'resourceNameOverride'>;
