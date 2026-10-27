/** A server-side warning or error attached to a Neo4j query response. */
export type Neo4jNotification = {
  code: string;
  description: string;
  severity: 'WARNING' | 'ERROR';
  title: string;
  position: {
    offset: number;
    line: number;
    column: number;
  };
  category: string;
};
