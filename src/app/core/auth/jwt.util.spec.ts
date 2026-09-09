import { decodeJwtPayload, isTokenExpired, JwtPayload } from './jwt.util';

function makeToken(payload: unknown): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'RS256' })}.${base64url(payload)}.signature`;
}

describe('jwt.util', () => {
  describe('decodeJwtPayload', () => {
    it('decodes a valid token', () => {
      const payload: JwtPayload = {
        sub: 'alice',
        role: 'USER',
        uid: '1001',
        iat: 1000,
        exp: 2000,
      };
      expect(decodeJwtPayload(makeToken(payload))).toEqual(payload);
    });

    it('returns null for a malformed token', () => {
      expect(decodeJwtPayload('not-a-jwt')).toBeNull();
      expect(decodeJwtPayload('only.two')).toBeNull();
      expect(decodeJwtPayload('')).toBeNull();
    });

    it('returns null when the payload segment is not valid base64/JSON', () => {
      expect(decodeJwtPayload('header.!!!not-base64!!!.sig')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('is true for a null payload', () => {
      expect(isTokenExpired(null)).toBe(true);
    });

    it('is true when exp is in the past', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) - 60 } as JwtPayload;
      expect(isTokenExpired(payload)).toBe(true);
    });

    it('is false when exp is in the future', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 } as JwtPayload;
      expect(isTokenExpired(payload)).toBe(false);
    });
  });
});
