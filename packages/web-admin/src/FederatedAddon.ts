import { BaseUrlResolvers } from 'quidproquo-web-react';

export type FederatedTab = {
  name: string;
  View: React.ComponentType;
  icon?: React.ReactElement;
};

export type FederatedAddon = {
  tab: FederatedTab;

  // We use this to detect what is an addon when importing from a federated module
  isQpqAdminFederatedAddon: boolean;
};

// Context handed to the addon loader so the host application can resolve
// remote modules however it likes (eg. module federation, dynamic import, ...).
export type LoadFederatedAddonsContext = {
  baseUrlResolvers: BaseUrlResolvers;
  accessToken?: string;
};

// Provided by the host application via <App loadAddons={...} />. quidproquo-web-admin
// no longer owns the federation mechanism - it just asks for the addons.
export type LoadFederatedAddons = (context: LoadFederatedAddonsContext) => Promise<FederatedAddon[]>;
