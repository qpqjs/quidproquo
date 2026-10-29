export type StreamEncoding = 'text' | 'binary' | 'json';

export type StreamDataType<E extends StreamEncoding, T = unknown> = E extends 'text'
  ? string
  : E extends 'binary'
    ? Uint8Array
    : E extends 'json'
      ? T
      : never;

// The second parameter is a phantom: it carries the chunk type for callers and is never read here.
export interface StreamHandle<E extends StreamEncoding = StreamEncoding, _T = unknown> {
  id: string;
  encoding: E;
}

export interface StreamChunk<T = unknown> {
  done: boolean;
  skipped?: boolean;
  data?: T;
}

export interface StreamRegistry {
  register(id: string, iterator: AsyncIterableIterator<string>): void;
  read(id: string, noWait?: boolean): Promise<StreamChunk<string>>;
  close(id: string): void;
  has(id: string): boolean;
}
