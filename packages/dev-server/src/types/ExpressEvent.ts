import { QPQBinaryData } from '@qpqjs/core';

export type ExpressEvent = {
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
};

export type ExpressEventResponse = {
  statusCode: number;
  body: string;
  headers: {
    [key: string]: undefined | string;
  };
  isBase64Encoded: boolean;
};
