export enum QpqjsServiceEnum {
  Admin = 'admin',
  Auth = 'auth',
  Design = 'design',
  Shell = 'shell',
  Test = 'test',
  TestA = 'testa',
}

export type QpqjsServiceEnumValues = `${QpqjsServiceEnum}`;
export const qpqjsServiceNames: QpqjsServiceEnum[] = Object.values(
  QpqjsServiceEnum
) as QpqjsServiceEnum[];
