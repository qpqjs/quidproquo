export enum CloudflareDnsDeployEventEnum {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}

export interface CloudflareDnsEntry {
  value: string;
  type: 'CNAME' | 'A';
  proxied: boolean;
}

export interface CloudflareDnsEntries {
  [Key: string]: CloudflareDnsEntry;
}

export interface CloudflareDnsDeployEventCommon {
  siteDns: string;
  dnsEntries: CloudflareDnsEntries;
  apiSecretName: string;
}
export interface CloudflareDnsDeployEventCreate extends CloudflareDnsDeployEventCommon {
  RequestType: CloudflareDnsDeployEventEnum.Create;
}

export interface CloudflareDnsDeployEventUpdate extends CloudflareDnsDeployEventCommon {
  RequestType: CloudflareDnsDeployEventEnum.Update;
  oldDnsEntries: CloudflareDnsEntries;
}

export interface CloudflareDnsDeployEventDelete extends CloudflareDnsDeployEventCommon {
  RequestType: CloudflareDnsDeployEventEnum.Delete;
}

export type CloudflareDnsDeployEvent = CloudflareDnsDeployEventCreate | CloudflareDnsDeployEventUpdate | CloudflareDnsDeployEventDelete;

export type CloudflareDnsDeployEventResponse = void;
