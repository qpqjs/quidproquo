import React, { createContext, useContext } from 'react';

import { LoadFederatedAddons } from './FederatedAddon';

// Default: no host loader provided, so there are no addons.
const noopLoadAddons: LoadFederatedAddons = async () => [];

const FederatedAddonContext = createContext<LoadFederatedAddons>(noopLoadAddons);

export type FederatedAddonProviderProps = {
  loadAddons?: LoadFederatedAddons;
  children: React.ReactNode;
};

export const FederatedAddonProvider: React.FC<FederatedAddonProviderProps> = ({ loadAddons, children }) => (
  <FederatedAddonContext.Provider value={loadAddons ?? noopLoadAddons}>{children}</FederatedAddonContext.Provider>
);

export const useLoadFederatedAddons = (): LoadFederatedAddons => useContext(FederatedAddonContext);
