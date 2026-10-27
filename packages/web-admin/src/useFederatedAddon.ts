import { useAuthAccessToken, useBaseUrlResolvers, useEffectCallback } from 'quidproquo-web-react';

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
      .catch((e) => {
        console.log(e);
        console.log('Unable to federate modules in');
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
