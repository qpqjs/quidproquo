import { AskResponse, QPQBinaryData } from '../../types';

export enum TextFileType {
  Json = 'Json',
  Xml = 'Xml',
  PlainText = 'PlainText',
  Html = 'Html',
  Css = 'Css',
  JavaScript = 'JavaScript',
  Csv = 'Csv',
  Markdown = 'Markdown',
  Yaml = 'Yaml',
  Rtf = 'Rtf',
}

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
// Node's Buffer, so this also works in browser bundles of quidproquo-core. Mirrors the
// decode direction in StreamReadRequester, which already uses atob.
const encodeUtf8ToBase64 = (textData: string): string => {
  const utf8Bytes = new TextEncoder().encode(textData);

  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
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
