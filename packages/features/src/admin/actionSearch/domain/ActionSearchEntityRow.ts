export type ActionSearchEntityRow = {
  linkKey: string;
  entityType: string;
  createdAt: string;
  ttl?: number;
} & Record<string, unknown>;
