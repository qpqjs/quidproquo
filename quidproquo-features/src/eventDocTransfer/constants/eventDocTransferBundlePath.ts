/** Where a staged export bundle lives on the transfer drive. */
export const eventDocTransferExportPath = (transferId: string): string => `exports/${transferId}.json`;

/** Where an uploaded bundle lives on the transfer drive. */
export const eventDocTransferImportPath = (transferId: string): string => `imports/${transferId}.json`;

/** Where a forced overwrite parks the discarded events before deleting them. Keyed by transfer and doc so backups never collide. */
export const eventDocTransferDiscardedPath = (transferId: string, docId: string): string => `discarded/${transferId}/${docId}.json`;
