export enum QpqjsServiceEnum {
  Admin = 'admin',
  Auth = 'auth',
  Design = 'design',
  Shell = 'shell',
  Test = 'test',
}

export type QpqjsServiceEnumValues = `${QpqjsServiceEnum}`;
export const qpqjsServiceNames: QpqjsServiceEnum[] = Object.values(
  QpqjsServiceEnum
) as QpqjsServiceEnum[];
