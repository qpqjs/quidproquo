import { FederatedAddon, FederatedTab } from './FederatedAddon';

export function createAddon(tabName: FederatedTab['name'], view: FederatedTab['View']) {
  const addon: FederatedAddon = {
    tab: {
      name: tabName,
      View: view,
    },

    isQpqAdminFederatedAddon: true,
  };

  return addon;
}
