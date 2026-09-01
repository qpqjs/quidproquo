// What testa read back from the test service's probe store after writing a
// row to it. The caller reads the same row from its own side and compares.
export type CrossServiceKeyValueStoreProbeResult = {
  recordValue: number;
};
