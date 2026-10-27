import { TransportCodec } from '../types/TransportCodec';
import { base64Codec } from './base64Codec';

/** Every wrapping encoding the walker unwraps before trying the container codecs. */
export const transportCodecs: readonly TransportCodec[] = [base64Codec];
