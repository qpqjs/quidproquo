import { KvsAdvancedDataType, KvsUpdateAction, KvsUpdateActionType } from '../types';
import { KvsAttributePath } from '../types/KvsAttributePath';

export const kvsSet = (attributePath: KvsAttributePath, value: KvsAdvancedDataType): KvsUpdateAction => ({
  attributePath,
  action: KvsUpdateActionType.Set,
  value,
});

export const kvsRemove = (attributePath: KvsAttributePath): KvsUpdateAction => ({
  attributePath,
  action: KvsUpdateActionType.Remove,
});

export const kvsAdd = (attributePath: KvsAttributePath, value: KvsAdvancedDataType): KvsUpdateAction => ({
  attributePath,
  action: KvsUpdateActionType.Add,
  value,
});

export const kvsDelete = (attributePath: KvsAttributePath, value: KvsAdvancedDataType): KvsUpdateAction => ({
  attributePath,
  action: KvsUpdateActionType.Delete,
  value,
});

/**
 * Sets an attribute only if it does not already exist.
 * Useful for setting initial values like `firstSeen` timestamps.
 *
 * @param attributePath - The path to the attribute
 * @param value - The value to set if the attribute doesn't exist
 */
export const kvsSetIfNotExists = (attributePath: KvsAttributePath, value: KvsAdvancedDataType): KvsUpdateAction => ({
  attributePath,
  action: KvsUpdateActionType.SetIfNotExists,
  value,
});

/**
 * Atomically increments a numeric attribute.
 * If the attribute doesn't exist, it is initialized to `defaultValue` before incrementing.
 *
 * @param attributePath - The path to the numeric attribute
 * @param incrementBy - The amount to increment by
 * @param defaultValue - The initial value if the attribute doesn't exist (default: 0)
 */
export const kvsIncrement = (attributePath: KvsAttributePath, incrementBy: number, defaultValue: number = 0): KvsUpdateAction => ({
  attributePath,
  action: KvsUpdateActionType.Increment,
  value: incrementBy,
  defaultValue,
});

/**
 * Atomically decrements a numeric attribute.
 * If the attribute doesn't exist, it is initialized to `defaultValue` before decrementing.
 *
 * @param attributePath - The path to the numeric attribute
 * @param decrementBy - The amount to decrement by
 * @param defaultValue - The initial value if the attribute doesn't exist (default: 0)
 */
export const kvsDecrement = (attributePath: KvsAttributePath, decrementBy: number, defaultValue: number = 0): KvsUpdateAction => ({
  attributePath,
  action: KvsUpdateActionType.Increment,
  value: -decrementBy,
  defaultValue,
});

export const kvsUpdate = (actions: KvsUpdateAction[]): KvsUpdateAction[] => actions;
