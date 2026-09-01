// What testa read back from the test service's probe drive after writing a
// file to it. The caller reads the same file from its own side and compares.
export type CrossServiceStorageDriveProbeResult = {
  filepath: string;
  fileContents: string;
};
