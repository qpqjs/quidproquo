import { QpqIsoDateTime } from '../../../types/QpqIsoDateTime';

export type AuthenticationInfo = {
  accessToken?: string;
  expirationDurationInSeconds?: number;
  expiresAt?: QpqIsoDateTime;
  idToken?: string;
  refreshToken?: string;
  tokenType?: string;
};
