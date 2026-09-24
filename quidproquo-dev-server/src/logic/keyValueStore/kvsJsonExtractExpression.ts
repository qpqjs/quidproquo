/**
 * SQL reading one top-level attribute out of a row's `data` json. The key is quoted so a dotted or dashed
 * attribute name addresses one key rather than a nested path. GSI expression indexes and index-ordered
 * reads must use this exact expression for sqlite to match them up.
 */
export const kvsJsonExtractExpression = (attributeName: string): string => `json_extract(data, '$."${attributeName.replace(/'/g, "''")}"')`;
