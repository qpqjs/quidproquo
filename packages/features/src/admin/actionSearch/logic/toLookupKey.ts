// The framework owns the `${entityType}#` prefix so definitions can never
// collide across entity types; lookupKeys authors emit local keys only.
export const toLookupKey = (entityType: string, localKey: string): string => `${entityType}#${localKey}`;
