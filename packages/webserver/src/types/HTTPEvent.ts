import { HTTPMethod, QPQBinaryData } from 'quidproquo-core';

export interface HttpEventHeaders {
  [key: string]: undefined | string;
}

export interface HttpEventRouteParams {
  [key: string]: string;
}

export enum FileUploadErrorTypeEnum {
  fileTooLarge = 'fileTooLarge',
  tooManyFiles = 'tooManyFiles',
  tooManyFields = 'tooManyFields',
  disallowedMimeType = 'disallowedMimeType',
  malformed = 'malformed',
}

export interface HTTPEventFileUploadError {
  errorType: FileUploadErrorTypeEnum;
  message: string;
}

export interface HTTPEvent {
  path: string;
  query: { [key: string]: undefined | string | string[] };
  body?: string;
  headers: HttpEventHeaders;
  method: HTTPMethod;
  correlation: string;
  sourceIp: string;
  isBase64Encoded: boolean;
  files?: QPQBinaryData[];

  // Set instead of `files` when a multipart body fails upload validation (size/count/type
  // limits) or cannot be parsed; the event auto-responds with the matching 4xx before the
  // route story runs.
  fileUploadError?: HTTPEventFileUploadError;
}

export interface HTTPEventResponse {
  status: number;
  body?: string;
  headers?: HttpEventHeaders;
  isBase64Encoded: boolean;
}

// type ParseParamType<S extends string> = S extends `${infer ParamName}:number`
//   ? { name: ParamName; type: number }
//   : S extends `${infer ParamName}:int`
//   ? { name: ParamName; type: number }
//   : S extends `${infer ParamName}:boolean`
//   ? { name: ParamName; type: boolean }
//   : { name: S; type: string };

// type ExtractRouteParams<
//   S extends string,
//   Prev extends Record<string, any> = {}
// > = string extends S
//   ? Record<string, string | number | boolean>
//   : S extends `${infer _Start}{${infer Param}}${infer Rest}`
//   ? ExtractRouteParams<
//       Rest,
//       Prev & {
//         [K in ParseParamType<Param>['name']]: ParseParamType<Param>['type'];
//       }
//     >
//   : Prev;

// type ExampleParams =
//   ExtractRouteParams<'template/{code}/version/{version:number}/{myBool:boolean}/{myInt:int}'>;
