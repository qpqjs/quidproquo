// Shared base type for common properties
export type GraphEntity = {
  $id: string;
  $properties: Record<string, any>;
};
