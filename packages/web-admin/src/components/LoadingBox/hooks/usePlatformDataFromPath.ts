import { useEffect, useRef, useState } from 'react';

import { usePlatformApiGet } from '../../../view';

export const usePlatformDataFromPath = <T>(path?: string): T | null => {
  const [data, setData] = useState<T | null>(null);
  const loadData = usePlatformApiGet<T>(path);
  const cache = useRef<Record<string, T>>({});

  useEffect(() => {
    if (!path) {
      return;
    }

    if (cache.current[path]) {
      setData(cache.current[path]);
      return;
    }

    let allowDataSet = true;
    loadData().then((newData) => {
      if (allowDataSet) {
        setData(newData);
      }

      cache.current[path] = newData;
    });

    return () => {
      allowDataSet = false;
    };
  }, [path, loadData]);

  return data;
};
