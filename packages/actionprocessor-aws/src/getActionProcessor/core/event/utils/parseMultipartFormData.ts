import { QPQBinaryData } from 'quidproquo-core';
import { FileUploadErrorTypeEnum, FileUploadSettings } from 'quidproquo-webserver';

import { APIGatewayEvent } from 'aws-lambda';
import Busboy from 'busboy';

interface MultipartFile {
  name: string;
  filename: string;
  content: Buffer;
  contentType: string;
  encoding: string;
}

interface BusboyInfo {
  filename: string;
  encoding: string;
  mimeType: string;
}

type MultipartRequest = {
  fields: Record<string, string>;
  files: MultipartFile[];
};

export class FileUploadValidationError extends Error {
  constructor(
    public readonly errorType: FileUploadErrorTypeEnum,
    message: string,
  ) {
    super(message);
    this.name = 'FileUploadValidationError';
  }
}

// Reduce a client-supplied filename to a bare, path-traversal-safe name.
export const sanitizeFilename = (filename?: string): string => {
  const baseName = (filename || '')
    .split(/[/\\]/)
    .filter((segment) => segment.length > 0)
    .pop();

  // eslint-disable-next-line no-control-regex
  const cleaned = (baseName || '').replace(/[\x00-\x1f]/g, '');

  if (!cleaned || cleaned === '.' || cleaned === '..') {
    return 'unnamed';
  }

  return cleaned;
};

const isMimeTypeAllowed = (mimeType: string, allowedMimeTypes?: string[]): boolean => {
  if (!allowedMimeTypes) {
    return true;
  }

  const normalizedMimeType = (mimeType || '').toLowerCase();

  return allowedMimeTypes.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase();

    return normalizedAllowed.endsWith('/*')
      ? normalizedMimeType.startsWith(normalizedAllowed.slice(0, -1))
      : normalizedMimeType === normalizedAllowed;
  });
};

export const parseMultipartFormData = (event: APIGatewayEvent, fileUploadSettings: FileUploadSettings): Promise<QPQBinaryData[]> =>
  new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type'],
      },
      limits: {
        fileSize: fileUploadSettings.maxFileSizeBytes,
        files: fileUploadSettings.maxFileCount,
        fields: fileUploadSettings.maxFieldCount,
        fieldSize: fileUploadSettings.maxFieldSizeBytes,
      },
    });

    const result: MultipartRequest = {
      files: [],
      fields: {},
    };

    let settled = false;
    const rejectOnce = (error: Error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    busboy.on('file', (name: string, file: any, info: BusboyInfo) => {
      const filename = sanitizeFilename(info.filename);

      if (!isMimeTypeAllowed(info.mimeType, fileUploadSettings.allowedMimeTypes)) {
        rejectOnce(
          new FileUploadValidationError(
            FileUploadErrorTypeEnum.disallowedMimeType,
            `File "${filename}" has disallowed content type "${info.mimeType}"`,
          ),
        );
        file.resume();
        return;
      }

      const chunks: Buffer[] = [];

      file.on('data', (data: Buffer) => {
        chunks.push(data);
      });

      // Emitted when the stream is truncated at limits.fileSize - a silently truncated upload must fail, not succeed
      file.on('limit', () => {
        rejectOnce(
          new FileUploadValidationError(
            FileUploadErrorTypeEnum.fileTooLarge,
            `File "${filename}" exceeds the maximum file size of ${fileUploadSettings.maxFileSizeBytes} bytes`,
          ),
        );
      });

      file.on('end', () => {
        const content = Buffer.concat(chunks);

        if (!settled && content.length > 0) {
          result.files.push({
            filename,
            contentType: info.mimeType,
            encoding: info.encoding,
            name: name,
            content,
          });
        }
      });
    });

    busboy.on('filesLimit', () => {
      rejectOnce(
        new FileUploadValidationError(FileUploadErrorTypeEnum.tooManyFiles, `Upload exceeds the maximum of ${fileUploadSettings.maxFileCount} files`),
      );
    });

    busboy.on('fieldsLimit', () => {
      rejectOnce(
        new FileUploadValidationError(
          FileUploadErrorTypeEnum.tooManyFields,
          `Upload exceeds the maximum of ${fileUploadSettings.maxFieldCount} fields`,
        ),
      );
    });

    busboy.on('field', (name: string, value: string) => {
      result.fields[name] = value;
    });

    busboy.on('error', (error: any) => {
      rejectOnce(error);
    });

    busboy.on('finish', () => {
      if (settled) {
        return;
      }
      settled = true;

      const qpqBinaryFiles: QPQBinaryData[] = result.files.map(
        (f) =>
          ({
            filename: f.filename,
            mimetype: f.contentType,
            base64Data: f.content.toString('base64'),
          }) as QPQBinaryData,
      );

      resolve(qpqBinaryFiles);
    });

    busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    busboy.end();
  });
