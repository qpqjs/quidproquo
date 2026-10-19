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
});
