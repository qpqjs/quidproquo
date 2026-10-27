/** Per-collection blob drive name. Holds `<docId>/assets/<guid>` (immutable uploads) and `<docId>/runtime/<guid>` (disposable artifacts). */
export const eventDocStorageDriveName = (storeName: string): string => `${storeName}edocs`.toLowerCase();
