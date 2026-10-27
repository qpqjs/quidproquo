import { describe, expect, it } from 'vitest';

import { eventDocHeadMovedTopic } from '../constants/eventDocHeadMovedTopic';
import { parseEventDocHeadMovedTopic } from './parseEventDocHeadMovedTopic';

describe('parseEventDocHeadMovedTopic', () => {
  it('round-trips the topic builder', () => {
    expect(parseEventDocHeadMovedTopic(eventDocHeadMovedTopic('envelopes', 'doc-1'))).toEqual({ storeName: 'envelopes', docId: 'doc-1' });
  });

  it('rejects anything that is not exactly prefix, store and doc id', () => {
    expect(parseEventDocHeadMovedTopic('eventDoc#envelopes')).toBeNull();
    expect(parseEventDocHeadMovedTopic('eventDoc#envelopes#doc-1#extra')).toBeNull();
    expect(parseEventDocHeadMovedTopic('other#envelopes#doc-1')).toBeNull();
    expect(parseEventDocHeadMovedTopic('eventDoc##doc-1')).toBeNull();
    expect(parseEventDocHeadMovedTopic('')).toBeNull();
  });

  // Security regression: the topic grammar is exact, so a trailing separator, a different case or a scope prefix never
  // resolves to a document another subscriber could be told about.
  it('rejects trailing separators, case variants and scope-prefixed lookalikes', () => {
    expect(parseEventDocHeadMovedTopic('eventDoc#envelopes#doc-1#')).toBeNull();
    expect(parseEventDocHeadMovedTopic('EventDoc#envelopes#doc-1')).toBeNull();
    expect(parseEventDocHeadMovedTopic('TENANT#a#eventDoc#envelopes#doc-1')).toBeNull();
    expect(parseEventDocHeadMovedTopic('eventDoc#envelopes#')).toBeNull();
  });
});
