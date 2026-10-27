import { GenericDataResourceActionTypeEnum } from '@qpqjs/webserver';

const webserverGenericDataResourceActionComponentMap: Record<string, string[]> = {
  [GenericDataResourceActionTypeEnum.Put]: ['askPutGenericDataResource', 'tableName', 'item'],
  [GenericDataResourceActionTypeEnum.Scan]: ['askScanGenericDataResource', 'tableName', 'maxItems'],
};

export default webserverGenericDataResourceActionComponentMap;
