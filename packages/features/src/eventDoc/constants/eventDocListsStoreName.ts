/**
 * List views store name derived from the collection's storeName. pk=viewName#type, sk=document id: one row per
 * document per list view, holding that view's state at the document's head.
 */
export const eventDocListsStoreName = (storeName: string): string => `${storeName}Lists`;
