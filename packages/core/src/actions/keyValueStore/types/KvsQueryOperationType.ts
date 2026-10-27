/**
 * The KvsQueryOperationType enum represents possible operations
 * for a key-value store query.
 * Each operation is annotated with its corresponding DynamoDB condition.
 */
export enum KvsQueryOperationType {
  /** Corresponds to the DynamoDB 'EQ' condition. */
  Equal = 'Equal',

  /** Corresponds to the DynamoDB 'NE' condition. */
  NotEqual = 'NotEqual',

  /** Corresponds to the DynamoDB 'LT' condition. */
  LessThan = 'LessThan',

  /** Corresponds to the DynamoDB 'LE' condition. */
  LessThanOrEqual = 'LessThanOrEqual',

  /** Corresponds to the DynamoDB 'GT' condition. */
  GreaterThan = 'GreaterThan',

  /** Corresponds to the DynamoDB 'GE' condition. */
  GreaterThanOrEqual = 'GreaterThanOrEqual',

  /** Corresponds to the DynamoDB 'BETWEEN' condition. */
  Between = 'Between',

  /** Corresponds to the DynamoDB 'IN' condition. */
  In = 'In',

  /** Corresponds to the DynamoDB 'AttributeExists' condition. */
  Exists = 'Exists',

  /** Corresponds to the DynamoDB 'AttributeNotExists' condition. */
  NotExists = 'NotExists',

  /** Corresponds to the DynamoDB 'BEGINS_WITH' condition. */
  BeginsWith = 'BeginsWith',

  /** Corresponds to the DynamoDB 'CONTAINS' condition. */
  Contains = 'Contains',

  /** Corresponds to the DynamoDB 'NOT_CONTAINS' condition. */
  NotContains = 'NotContains',
}

/**
 * Enum representing the logical operators for a key-value store query.
 */
export enum KvsLogicalOperatorType {
  /**
   * Represents the logical AND operator.
   */
  And = 'And',

  /**
   * Represents the logical OR operator.
   */
  Or = 'Or',
}

/**
 * The `KvsUpdateActionType` enum represents the types of update actions in DynamoDB.
 */
export enum KvsUpdateActionType {
  /**
   * The `Set` action is used to create an attribute or change the value of an existing attribute.
   */
  Set = 'Set',

  /**
   * The `Remove` action is used to delete an attribute from an item.
   */
  Remove = 'Remove',

  /**
   * The `Add` action is used to increment/decrement a number data type or add elements to a set data type.
   * Note: For number data types, if the attribute does not already exist, DynamoDB will create it.
   */
  Add = 'Add',

  /**
   * The `Delete` action is used to remove one or more elements from a set or a list data type attribute.
   * Note: This action only applies to set and list data types.
   */
  Delete = 'Delete',

  /**
   * The `SetIfNotExists` action sets an attribute only if it does not already exist.
   * Corresponds to DynamoDB's `if_not_exists(path, value)` function.
   */
  SetIfNotExists = 'SetIfNotExists',

  /**
   * The `Increment` action atomically increments a numeric attribute.
   * If the attribute does not exist, it is initialized to the default value before incrementing.
   * Corresponds to DynamoDB's `SET path = if_not_exists(path, default) + increment`.
   */
  Increment = 'Increment',
}
