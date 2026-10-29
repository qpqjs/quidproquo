import { useAuthAccessToken, useBaseUrlResolvers, useEffectCallback } from '@qpqjs/web-react';

import { useEffect, useState } from 'react';

import { FederatedAddon } from './FederatedAddon';
import { useLoadFederatedAddons } from './FederatedAddonProvider';

export function useFederatedAddon(): {
  addons: FederatedAddon[];
  loading: boolean;
} {
  const [federatedAddons, setFederatedAddons] = useState<FederatedAddon[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const accessToken = useAuthAccessToken();
  const baseUrlResolvers = useBaseUrlResolvers();
  const loadAddons = useLoadFederatedAddons();

  // Stable identity so the mount-only effect below can list it as a dependency.
  const doAsyncWork = useEffectCallback(async () => {
    setLoading(true);

    const addons = await loadAddons({ baseUrlResolvers, accessToken });

    setFederatedAddons(addons);
  });

  useEffect(() => {
    doAsyncWork()
      .catch(() => {
        // A remote that fails to load leaves the addon list empty; the shell renders without it.
      })
      .finally(() => {
        setLoading(false);
      });
  }, [doAsyncWork]);

  return {
    addons: federatedAddons,
    loading,
  };
}
