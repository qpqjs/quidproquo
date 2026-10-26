import { createContext } from 'react';

import { AuthState } from './types';

export const authContext = createContext<AuthState>({
  username: '',
});
