import { AuthState } from '../types/AuthState';

export const createInitialAuthState = (): AuthState => ({
  username: '',
  password: '',
});
