import { QPQBinaryData } from 'quidproquo-core';

export interface ExpressEvent {
  protocol: string;
  host: string;
  path: string;
  ip: string;
  method: string;
  query: { [key: string]: undefined | string | string[] };

  correlation: string;
  isBase64Encoded: boolean;

  body: any;
  headers: {
    [key: string]: undefined | string;
  };

  files?: QPQBinaryData[];
}

export interface ExpressEventResponse {
  statusCode: number;
  body: string;
  headers: {
    [key: string]: undefined | string;
  };
  isBase64Encoded: boolean;
}
