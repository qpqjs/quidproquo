// MyContext.js
import { createContext } from 'react';

import { LoadingApi } from '../../types';

// Api for adding / removing loading
export const LoadingApiContext = createContext<LoadingApi>({
  addLoading: () => {},
  removeLoading: () => {},
});
