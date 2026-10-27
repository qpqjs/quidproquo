export type ActionSearchActionRow = {
  correlation: string;
  actionIndex: number;
  actionType: string;
  startedAt: string;
  moduleName: string;
  executionTimeMs: number;
  error?: string;
  searchText?: string;
  linkKey?: string;
  ttl?: number;
} & Record<string, unknown>;
