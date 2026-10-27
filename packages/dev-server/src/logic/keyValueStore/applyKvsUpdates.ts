import { KvsAttributePath, KvsUpdate, KvsUpdateActionType } from 'quidproquo-core';

export const getPathArray = (path: KvsAttributePath): string[] => {
  if (typeof path === 'string') {
    return path.split('.');
  }
  return path.map((p: string | number) => String(p));
};

export const getNestedValue = (obj: any, path: string[]): any => {
  return path.reduce((current, key) => current?.[key], obj);
};

export const setNestedValue = (obj: any, path: string[], value: any): void => {
  const lastKey = path[path.length - 1];
  const parentPath = path.slice(0, -1);

  const parent = parentPath.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  parent[lastKey] = value;
};

export const removeNestedValue = (obj: any, path: string[]): void => {
  const lastKey = path[path.length - 1];
  const parentPath = path.slice(0, -1);

  const parent = getNestedValue(obj, parentPath);
  if (parent) {
    delete parent[lastKey];
  }
};

// Pure DynamoDB-style update engine shared by every KVS storage engine. Given an
// item and a list of updates, returns a new item with all updates applied.
export const applyUpdateToItem = (item: any, updates: KvsUpdate): any => {
  const updatedItem = { ...item };

  for (const update of updates) {
    const pathArray = getPathArray(update.attributePath);

    switch (update.action) {
      case KvsUpdateActionType.Set:
        setNestedValue(updatedItem, pathArray, update.value);
        break;

      case KvsUpdateActionType.Remove:
        removeNestedValue(updatedItem, pathArray);
        break;

      case KvsUpdateActionType.Add: {
        const currentValue = getNestedValue(updatedItem, pathArray);
        if (typeof currentValue === 'number' && typeof update.value === 'number') {
          setNestedValue(updatedItem, pathArray, currentValue + update.value);
        } else if (Array.isArray(currentValue) && Array.isArray(update.value)) {
          setNestedValue(updatedItem, pathArray, [...new Set([...currentValue, ...update.value])]);
        } else if (currentValue === undefined && typeof update.value === 'number') {
          setNestedValue(updatedItem, pathArray, update.value);
        }
        break;
      }

      case KvsUpdateActionType.Delete: {
        const existing = getNestedValue(updatedItem, pathArray);
        if (Array.isArray(existing) && Array.isArray(update.value)) {
          const filtered = existing.filter((item) => !(update.value as any[]).includes(item));
          setNestedValue(updatedItem, pathArray, filtered);
        }
        break;
      }

      case KvsUpdateActionType.SetIfNotExists: {
        const currentValue = getNestedValue(updatedItem, pathArray);
        if (currentValue === undefined || currentValue === null) {
          setNestedValue(updatedItem, pathArray, update.value);
        }
        break;
      }

      case KvsUpdateActionType.Increment: {
        const currentValue = getNestedValue(updatedItem, pathArray);
        const baseValue = currentValue === undefined || currentValue === null ? (update.defaultValue as number) : currentValue;
        setNestedValue(updatedItem, pathArray, baseValue + (update.value as number));
        break;
      }
    }
  }

  return updatedItem;
};
