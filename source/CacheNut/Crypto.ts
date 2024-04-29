/* eslint-disable n/no-unsupported-features/node-builtins */
import { Base64 } from 'js-base64';
import { ClipboardItemMeta } from './Model';

const c = crypto.subtle;

// Same as PublicKeyPayload
export interface KeyPayload {
  key: JsonWebKey;
  ts: number;
  salt: string;
}

// Same as ClipboardContent in cachenutd
export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
}

// Same as ClipboardItem in cachenutd
export type EncryptedClipboardItem = ClipboardItemMeta & {
  accountId: string;
  content: EncryptedPayload;
};

const createNonce = (byteLength: number): Uint8Array => crypto.getRandomValues(new Uint8Array(byteLength));

/** String properties of JsonWebKey interface. Excludes: ext, key_ops, oth */
const JwkProperties: (keyof JsonWebKey)[] = [
  'alg',
  'crv',
  'd',
  'dp',
  'dq',
  'e',
  'k',
  'kty',
  'n',
  'p',
  'q',
  'qi',
  'use',
  'x',
  'y',
];

/**
 * Returns a string with the properties of the given JsonWebKey
 */
function concatJwkProperties(jwk: JsonWebKey): string {
  let result = '';
  JwkProperties.forEach((p) => {
    result += jwk[p] || '';
  });

  return result;
}

export const createKeyPayload = async (cryptoKey: CryptoKey, salt: string): Promise<KeyPayload> => {
  const keyJwk = await c.exportKey('jwk', cryptoKey);

  const payload: KeyPayload = {
    key: keyJwk,
    salt,
    ts: Date.now(),
  };

  return payload;
};

/**
 * Computes a hash value for the given KeyPayload. Returns a hex-encoded string,
 * with the timestamp value appended: <hex-string>_<timestamp>
 */
export const computeKeyPayloadHash = async (payload: KeyPayload): Promise<string> => {
  const stringToHash =
    concatJwkProperties(payload.key) + payload.ts + payload.salt;

  return c.digest('SHA-256', new TextEncoder().encode(stringToHash)).then(
    (digest) =>
      `${Array.from(new Uint8Array(digest))
        .map((uint) => uint.toString(16))
        .join('')
        .toUpperCase()}_${payload.ts}`
  );
};

export const encryptPayload = async (key: CryptoKey, payload: unknown): Promise<EncryptedPayload> => {
  const payloadBuffer = new TextEncoder().encode(JSON.stringify(payload));
  const nonce = createNonce(12); // AES-GCM requires a 96-bit length
  const aesOptions = { name: 'AES-GCM', iv: nonce };
  const payloadEncrypted = await c.encrypt(aesOptions, key, payloadBuffer);
  return {
    ciphertext: Base64.fromUint8Array(new Uint8Array(payloadEncrypted)),
    nonce: Base64.fromUint8Array(nonce),
  };
};

export const decryptPayload = async <T>(key: CryptoKey, payload: EncryptedPayload): Promise<T> => {
  const ciphertext = Base64.toUint8Array(payload.ciphertext);
  const nonce = Base64.toUint8Array(payload.nonce);
  const aesOptions = {name: 'AES-GCM', iv: nonce};
  const plaintext = await c.decrypt(aesOptions, key, ciphertext);
  const payloadStr = new TextDecoder().decode(plaintext);
  return JSON.parse(payloadStr) as T;
};

export const createCryptoKey = async (): Promise<CryptoKey> =>
  c.generateKey({ name: 'AES-GCM', length: 256 }, true, [ 'encrypt', 'decrypt' ]);

export const createKeyPair = async (): Promise<CryptoKeyPair> => {
  const ecdhOptions = {
    name: 'ECDH',
    namedCurve: 'P-256', // P-256, P-384, P-521
  };

  return c.generateKey(ecdhOptions, true, ['deriveKey']);
};

export const createSharedKey = async (privateCryptoKey: CryptoKey, publicCryptoKey: CryptoKey): Promise<CryptoKey> =>
  c.deriveKey(
    { name: 'ECDH', public: publicCryptoKey },
    privateCryptoKey,
    { name: 'AES-GCM', length: 256 },
    true,
    [ 'encrypt', 'decrypt' ]
  );

export const createSalt = (charLength: number): string =>
  Base64.fromUint8Array(
    window.crypto.getRandomValues(new Uint8Array(charLength))
  ).substr(0, charLength);

export const parseCryptoKey = async (
  key: JsonWebKey | string
): Promise<CryptoKey> => {
  let jsonWebKey;
  if (typeof key === 'string') {
    jsonWebKey = JSON.parse(key) as JsonWebKey;
  } else {
    jsonWebKey = key;
  }
  return c.importKey('jwk', jsonWebKey, 'AES-GCM', true, [ 'encrypt', 'decrypt' ]);
};
