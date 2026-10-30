import { AskResponse, QPQBinaryData, TextFileType } from '../../types';

const TextFileTypeMimeTypeMap: { [key in TextFileType]: string } = {
  [TextFileType.Json]: 'application/json',
  [TextFileType.Xml]: 'application/xml',
  [TextFileType.PlainText]: 'text/plain',
  [TextFileType.Html]: 'text/html',
  [TextFileType.Css]: 'text/css',
  [TextFileType.JavaScript]: 'application/javascript',
  [TextFileType.Csv]: 'text/csv',
  [TextFileType.Markdown]: 'text/markdown',
  [TextFileType.Yaml]: 'application/x-yaml',
  [TextFileType.Rtf]: 'application/rtf',
};

// Base64-encode a string's UTF-8 bytes using web globals (TextEncoder/btoa) rather than
// Node's Buffer, so this also works in browser bundles of @qpqjs/core. Mirrors the
// decode direction in StreamReadRequester, which already uses atob.
const encodeUtf8ToBase64 = (textData: string): string => {
  const utf8Bytes = new TextEncoder().encode(textData);

  let binary = '';
  for (const byte of utf8Bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
};

export function* askCreateTextQpqBinaryData(textData: string, filename: string, fileType: TextFileType): AskResponse<QPQBinaryData> {
  const binaryData: QPQBinaryData = {
    base64Data: encodeUtf8ToBase64(textData),
    filename: filename,
    mimetype: TextFileTypeMimeTypeMap[fileType],
  };

  return binaryData;
}
