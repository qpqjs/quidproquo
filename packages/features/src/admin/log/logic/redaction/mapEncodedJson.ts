import { encodedJsonCodecs } from './codecs/encodedJsonCodecs';
import { transportCodecs } from './codecs/transportCodecs';
import { mapStrings } from './mapStrings';

type ContainerTransform = (container: unknown) => unknown;
type TextTransform = (text: string) => string;

/**
 * Deep-copies a value, and for every string leaf that holds an encoded container (json, a form
 * body, either optionally wrapped in a transport encoding such as base64) applies `transform` to
 * the decoded container and writes the re-encoded result back. Recurses into the decoded
 * container first, so json inside base64 inside json is reached. Every other leaf goes through
 * `transformText` (default identity), including the plain text inside a transport encoding,
 * which is re-encoded only if the transform changed it.
 */
export const mapEncodedJson = <T>(value: T, transform: ContainerTransform, transformText: TextTransform = (t) => t): T => {
  const mapContainerText = (text: string): string | null => {
    for (const codec of encodedJsonCodecs) {
      const decoded = codec.decode(text);
      if (decoded !== null) {
        const inner = mapEncodedJson(decoded, transform, transformText);
        return codec.encode(transform(inner));
      }
    }

    return null;
  };

  // Transport first: a base64 leaf whose payload is a container must never be read as a bare
  // container by a looser codec.
  const mapLeaf = (text: string): string => {
    for (const transport of transportCodecs) {
      const unwrapped = transport.decode(text);
      if (unwrapped === null) {
        continue;
      }

      const mapped = mapContainerText(unwrapped);
      if (mapped !== null) {
        return transport.encode(mapped);
      }

      const transformed = transformText(unwrapped);
      if (transformed !== unwrapped) {
        return transport.encode(transformed);
      }
    }

    return mapContainerText(text) ?? transformText(text);
  };

  return mapStrings(value, mapLeaf);
};
