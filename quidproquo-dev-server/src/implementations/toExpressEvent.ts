import { qpqWebServerUtils } from 'quidproquo-webserver';

import { Request } from 'express';

import { ExpressEvent } from '../types';
import { toEventBody } from './toEventBody';

// Builds the event a service request becomes before it enters the story runtime.
//
// The query is parsed from the raw url rather than `req.query`: express's extended parser
// turns `a[b]=1` into nested objects and `a[]=1` into arrays, neither of which HttpEventQuery
// describes. Going through parseQueryString gives a route the same shape it sees deployed.
export const toExpressEvent = (req: Request, devPath: string, fallbackHost: string): ExpressEvent => {
  const [rawPath, rawQueryString = ''] = req.url.split('?');

  const event: ExpressEvent = {
    protocol: req.protocol,
    host: req.get('host') || fallbackHost,
    path: rawPath.substring(devPath.length),
    ip: req.socket.remoteAddress || '127.0.0.1',
    query: qpqWebServerUtils.parseQueryString(rawQueryString),
    correlation: '',

    headers: req.headers as {
      [key: string]: undefined | string;
    },
    method: req.method,
    isBase64Encoded: false,
    body: toEventBody(req),
  };

  // multer().any() leaves uploads as an array on the request
  if (Array.isArray(req.files)) {
    event.files = req.files.map((file) => ({
      base64Data: file.buffer.toString('base64'),
      filename: file.originalname,
      mimetype: file.mimetype,
    }));
  }

  return event;
};
