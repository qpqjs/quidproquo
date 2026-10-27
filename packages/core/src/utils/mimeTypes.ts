// Minimal MIME → extension lookup for download filename fallbacks.
// Inlined so we don't need the `mime-types` package, which depends on
// Node's `path` module and breaks browser bundling under webpack 5.
const MIME_TO_EXTENSION: Record<string, string> = {
  'application/json': 'json',
  'application/octet-stream': 'bin',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-tar': 'tar',
  'application/gzip': 'gz',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tif',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/html': 'html',
  'text/css': 'css',
  'text/xml': 'xml',
};

export const getExtensionForMimeType = (mimeType: string): string => {
  const key = mimeType.toLowerCase();

  // Own-property check so header-controlled values like "constructor" or
  // "__proto__" can't hit the prototype chain and leak an object instead of a string.
  return Object.prototype.hasOwnProperty.call(MIME_TO_EXTENSION, key) ? MIME_TO_EXTENSION[key] : 'bin';
};

// Strips parameters off a Content-Type header value, leaving just the MIME type
// (e.g. "text/plain; charset=utf-8" -> "text/plain").
export const getMimeTypeFromContentType = (contentType: string): string => contentType.split(';')[0].trim();
