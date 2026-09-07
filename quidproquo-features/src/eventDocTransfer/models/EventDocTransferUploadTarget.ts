/** Response of POST /transfer/upload: a presigned PUT for the bundle plus the transferId to quote back to plan/import. */
export type EventDocTransferUploadTarget = {
  uploadUrl: string;
  transferId: string;
};
