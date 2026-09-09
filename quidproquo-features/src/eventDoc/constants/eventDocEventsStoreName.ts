/** Events store name derived from the collection's storeName. pk=modelId, sk=numeric event id. */
export const eventDocEventsStoreName = (storeName: string): string => `${storeName}Events`;
