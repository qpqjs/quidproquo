import { describe, expect, it } from 'vitest';

import { CryptoActionType } from '../../actions';
import { runStory } from '../../testing';
import { askCryptoSignJwt } from './askCryptoSignJwt';

describe('askCryptoSignJwt', () => {
  it('signs the base64url header.payload and appends the signature', () => {
    const seen: { keyName: string; message: string }[] = [];

    const token = runStory(askCryptoSignJwt('my-signing-key', { sub: 'client-1', exp: 1700000000 }), {
      [CryptoActionType.Sign]: (action: any) => {
        seen.push(action.payload);
        return 'c2ln';
      },
    });

    // eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9 = {"alg":"RS256","typ":"JWT"}
    // eyJzdWIiOiJjbGllbnQtMSIsImV4cCI6MTcwMDAwMDAwMH0 = {"sub":"client-1","exp":1700000000}
    expect(token).toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGllbnQtMSIsImV4cCI6MTcwMDAwMDAwMH0.c2ln');
    expect(seen).toEqual([
      { keyName: 'my-signing-key', message: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGllbnQtMSIsImV4cCI6MTcwMDAwMDAwMH0' },
    ]);
  });
});
