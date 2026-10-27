export enum DeployEventType {
  Unknown = 'Unknown',
  Api = 'Api',
  Web = 'Web',
}

export enum DeployEventStatusType {
  Unknown = 'Unknown',
  Update = 'Update',
  Create = 'Create',
  Delete = 'Delete',
}

export type DeployEvent = {
  deployEventType: DeployEventType;
  deployEventStatusType: DeployEventStatusType;
};

export type DeployEventResponse = void;
