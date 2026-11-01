// The dev server's own JWTs: HS256 over a per-directory secret. Structurally a normal JWT, so
// everything that reads claims keeps working, and verifiable here, so a token minted for
// another checkout (or hand-rolled) is refused like a real pool would refuse it.
export const DEV_JWT_HEADER = { alg: 'HS256', typ: 'JWT' };
