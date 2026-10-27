import { useMemo } from 'react';

const metadataStore = new WeakMap<object, any>();

// Define named types for better readability
type MetadataGetter<M> = () => M | undefined;
type MetadataSetter<M> = (value: M) => void;
type UseMetadataReturn<M> = [MetadataGetter<M>, MetadataSetter<M>];

export function useMetadata<M>(key: object): UseMetadataReturn<M> {
  return useMemo<UseMetadataReturn<M>>(() => {
    const getMetadata: MetadataGetter<M> = () => metadataStore.get(key);
    const setMetadata: MetadataSetter<M> = (value) => {
      metadataStore.set(key, value);
    };

    return [getMetadata, setMetadata];
  }, [key]);
}
