// Events-table name derived by convention so a collection needs only one storeName.
// pk=modelId, sk=the event's numeric log position.
export const eventDocEventsStoreName = (storeName: string): string => `${storeName}Events`;
