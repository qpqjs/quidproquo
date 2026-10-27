import { KvsLogicalOperatorType, KvsQueryOperationType } from './KvsQueryOperationType';

export type KvsCoreDataType = string | number;
export type KvsBasicDataType = KvsCoreDataType | boolean;

export type KvsListDataType = KvsAdvancedDataType[];

// Use an interface for the recursive data type. Members may be undefined so that a
// domain model with OPTIONAL fields can be written directly; the marshaller drops
// undefined members, since DynamoDB has no representation for them.
export interface KvsObjectDataType {
  [key: string]: KvsAdvancedDataType | undefined;
}

export type KvsAdvancedDataType = KvsBasicDataType | KvsListDataType | KvsObjectDataType;

// Type for individual query conditions
export type KvsQueryCondition = {
  key: string;
  operation: KvsQueryOperationType;
  valueA?: KvsAdvancedDataType;
  valueB?: KvsBasicDataType;
};

// Type for logical operators
export type KvsLogicalOperator = {
  operation: KvsLogicalOperatorType;
  conditions: (KvsQueryCondition | KvsLogicalOperator)[];
};

// Type for the overall query operation
export type KvsQueryOperation = KvsQueryCondition | KvsLogicalOperator;
