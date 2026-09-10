import { Request } from 'express';

// Raw string bodies pass through verbatim. Multer leaves multipart fields as an object, which
// is re-serialised. body-parser sets `{}` when there was no body at all, where production
// delivers undefined, so an empty object is undefined here too.
export const toEventBody = (req: Request): string | undefined => {
  if (typeof req.body === 'string') {
    return req.body;
  }

  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }

  return undefined;
};
