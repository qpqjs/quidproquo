import { AuthState } from '../types/AuthState';

export const setPassword = (state: AuthState, password: string): AuthState => ({ ...state, password });
