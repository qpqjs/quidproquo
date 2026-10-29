export enum CloudflareDnsDeployEventEnum {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}

export type CloudflareDnsEntry = {
  value: string;
  type: 'CNAME' | 'A';
  proxied: boolean;
};

export type CloudflareDnsEntries = {
  [Key: string]: CloudflareDnsEntry;
};

export type CloudflareDnsDeployEventCommon = {
  siteDns: string;
  dnsEntries: CloudflareDnsEntries;
  apiSecretName: string;
};
export type CloudflareDnsDeployEventCreate = {
  RequestType: CloudflareDnsDeployEventEnum.Create;
} & CloudflareDnsDeployEventCommon;

export type CloudflareDnsDeployEventUpdate = {
  RequestType: CloudflareDnsDeployEventEnum.Update;
  oldDnsEntries: CloudflareDnsEntries;
} & CloudflareDnsDeployEventCommon;

export type CloudflareDnsDeployEventDelete = {
  RequestType: CloudflareDnsDeployEventEnum.Delete;
} & CloudflareDnsDeployEventCommon;

export type CloudflareDnsDeployEvent = CloudflareDnsDeployEventCreate | CloudflareDnsDeployEventUpdate | CloudflareDnsDeployEventDelete;

export type CloudflareDnsDeployEventResponse = void;
