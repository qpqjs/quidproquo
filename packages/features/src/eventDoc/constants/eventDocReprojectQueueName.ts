/**
 * Reproject queue name derived from the collection's storeName. The suffix is short for the same reason as the
 * snapshots store's: it is compounded into physical resource names.
 */
export const eventDocReprojectQueueName = (storeName: string): string => `${storeName}Reproj`;
