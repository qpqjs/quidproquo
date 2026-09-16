import { collectStrings } from './collectStrings';
import { parseJsonContainer } from './parseJsonContainer';

/**
 * A reported value that is itself JSON (a secret holding `{"user":"..","pass":".."}`, say) is
 * kept as-is AND every string inside it is reported too, recursively, so the fields are swept
 * wherever they appear on their own.
 */
export const expandJsonRedactions = (redactions: string[]): string[] => {
  return redactions.flatMap((value) => {
    const parsed = parseJsonContainer(value);
    return parsed === null ? [value] : [value, ...expandJsonRedactions(collectStrings(parsed))];
  });
};
