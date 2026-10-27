import { useContext } from 'react';

import { BaseUrlContext } from '../BaseUrlContext';
import { BaseUrlResolvers } from '../types';

export const useBaseUrlResolvers = (): BaseUrlResolvers => {
  const baseUrlResolvers = useContext(BaseUrlContext);
  return baseUrlResolvers;
};
