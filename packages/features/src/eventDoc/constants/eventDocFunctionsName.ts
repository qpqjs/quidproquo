/** Dynamic-functions registry name for a collection's EventDocFunctions, derived from storeName + type. */
export const eventDocFunctionsName = (storeName: string, type: string): string => `${storeName}#${type}#eventDocFunctions`;
