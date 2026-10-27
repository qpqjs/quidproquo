import { QpqPermission } from '../types/QpqPermission';
import { isQpqPermission } from './isQpqPermission';

/** Brand a permission key, throwing on a malformed one. The way app vocabularies declare their keys. */
export const toQpqPermission = (key: string): QpqPermission => {
  if (!isQpqPermission(key)) {
    throw new Error(`Invalid permission key: '${key}'. Expected colon-separated segments such as 'case:approve'.`);
  }

  return key;
};
