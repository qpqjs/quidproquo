/** An upload slot: the client PUTs the bytes to `uploadUrl`, then records `assetId` in a domain event. */
export type EventDocAssetUploadUrl = {
  uploadUrl: string;
  assetId: string;
};
