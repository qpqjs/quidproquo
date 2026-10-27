// Shared base type for common properties
export interface GraphEntity {
  $id: string;
  $properties: Record<string, any>;
}
