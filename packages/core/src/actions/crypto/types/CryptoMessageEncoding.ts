// How the `message` string given to askCryptoSign / askCryptoVerify carries the
// bytes to sign. 'utf8' signs the string's own UTF-8 bytes (text, a JWT signing
// input). 'base64' signs the bytes the string decodes to, for binary data such
// as a DER structure, which cannot travel as text without being corrupted.
export type CryptoMessageEncoding = 'utf8' | 'base64';
