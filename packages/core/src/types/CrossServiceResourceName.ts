export type CrossServiceResourceName = {
  name: string;
  service?: string;
};

export type ResourceName = string | CrossServiceResourceName;
