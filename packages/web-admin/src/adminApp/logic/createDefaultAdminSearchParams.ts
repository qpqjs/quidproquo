import { AdminSearchParams } from '../types/AdminSearchParams';

export const createDefaultAdminSearchParams = (): AdminSearchParams => ({
  runtimeType: '',
  service: '',
  startIsoDateTime: '',
  endIsoDateTime: '',
  user: '',
  info: '',
  msg: '',
  error: '',
  deep: '',
  logLevel: '',
});
