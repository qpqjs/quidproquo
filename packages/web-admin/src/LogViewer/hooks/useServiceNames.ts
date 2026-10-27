import { useEffectCallback } from 'quidproquo-web-react';

import { useEffect, useMemo } from 'react';

import { useAdminApp, useVolatileState } from '../../adminApp';

export type AutoCompleteOption = {
  label: string;
  value: string;
};

export const useServiceNames = (): AutoCompleteOption[] => {
  const [api] = useAdminApp();
  const volatile = useVolatileState();

  const serviceNames = volatile.serviceNames;

  // Stable identity so the mount-only effect below can list it as a dependency.
  const fetchData = useEffectCallback(() => {
    if (serviceNames.length === 0) {
      api.loadServiceNames();
    }
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const serviceOptions = useMemo(
    () =>
      (serviceNames.length ? serviceNames : ['All']).map((s) => ({
        label: s
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: s,
      })),
    [serviceNames],
  );

  return serviceOptions;
};
