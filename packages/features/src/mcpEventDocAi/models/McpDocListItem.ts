/** One document as listDocs returns it: just enough for a model to match the name the user gave. */
export type McpDocListItem = {
  id: string;
  name: string;
  code: string;
  updatedAt: string;
};
