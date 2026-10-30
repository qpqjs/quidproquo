import { AuthState } from '../types/AuthState';

export const setUsername = (state: AuthState, username: string): AuthState => ({ ...state, username });
