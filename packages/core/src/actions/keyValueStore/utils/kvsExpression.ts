import { KvsLogicalOperator, KvsLogicalOperatorType, KvsQueryCondition, KvsQueryOperation, KvsQueryOperationType } from '../types';

const kvsExpression = (
  key: string,
  operation: KvsQueryOperationType,
  valueA?: KvsQueryCondition['valueA'],
  valueB?: KvsQueryCondition['valueB'],
): KvsQueryCondition => ({
  key: key,
  operation: operation,
  valueA: valueA,
  valueB: valueB,
});

const kvsLogicalOperator = (operation: KvsLogicalOperatorType, conditions: KvsQueryOperation[]): KvsLogicalOperator => ({
  operation,
  conditions,
});

export const kvsEqual = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.Equal, value);

export const kvsNotEqual = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.NotEqual, value);

export const kvsLessThan = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.LessThan, value);

export const kvsLessThanOrEqual = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.LessThanOrEqual, value);

export const kvsGreaterThan = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.GreaterThan, value);

export const kvsGreaterThanOrEqual = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.GreaterThanOrEqual, value);

export const kvsBetween = (key: string, valueA: KvsQueryCondition['valueA'], valueB: KvsQueryCondition['valueB']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.Between, valueA, valueB);

export const kvsIn = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition => kvsExpression(key, KvsQueryOperationType.In, value);

export const kvsExists = (key: string): KvsQueryCondition => kvsExpression(key, KvsQueryOperationType.Exists);

export const kvsNotExists = (key: string): KvsQueryCondition => kvsExpression(key, KvsQueryOperationType.NotExists);

export const kvsBeginsWith = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.BeginsWith, value);

export const kvsContains = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.Contains, value);

export const kvsNotContains = (key: string, value: KvsQueryCondition['valueA']): KvsQueryCondition =>
  kvsExpression(key, KvsQueryOperationType.NotContains, value);

export const kvsAnd = (conditions: KvsQueryOperation[]): KvsLogicalOperator => kvsLogicalOperator(KvsLogicalOperatorType.And, conditions);

export const kvsOr = (conditions: KvsQueryOperation[]): KvsLogicalOperator => kvsLogicalOperator(KvsLogicalOperatorType.Or, conditions);
