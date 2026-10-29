import { Nullable } from '@qpqjs/core';

import { useEffect, useRef, useState } from 'react';

import { useExternalApiGet } from '../../../view';

export const useExternalData = <T>(url?: string): Nullable<T> => {
  const [, setData] = useState<Nullable<T>>(null);
  const loadData = useExternalApiGet<T>(url);
  const cache = useRef<Record<string, T>>({});

  useEffect(() => {
    if (!url) {
      setData(null);
      return;
    }

    if (cache.current[url]) {
      setData(cache.current[url]);
      return;
    }

    let allowDataSet = true;
    loadData().then((newData) => {
      if (allowDataSet) {
        setData(newData);
      }

      cache.current[url] = newData;
    });

    return () => {
      allowDataSet = false;
    };
  }, [url, loadData]);

  return cache.current[url || ''];
};
