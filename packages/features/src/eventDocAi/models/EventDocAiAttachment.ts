// A chat-turn reference to an eventDoc asset the user has already uploaded via the
// collection's asset routes. Only the assetId crosses the wire — the server derives
// the drive + filepath from the session's trusted docId, so a client can never point
// the AI at another doc's (or another drive's) files. filename/mediaType are display
// + content-type hints from the uploader; the bytes are whatever the asset holds.
export type EventDocAiAttachment = {
  assetId: string;
  filename: string;
  mediaType: string;
};
