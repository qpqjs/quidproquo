export type SecureUrlToken = {
  fullFilepath: string;
  operation: 'download' | 'upload';
  expiresAt: number;
  contentType?: string;
};
