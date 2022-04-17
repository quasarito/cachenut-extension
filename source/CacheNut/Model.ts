import browser from 'webextension-polyfill';

export interface CacheNutAccount {
  id: string;
  deviceId: string;
  token: string;
}

// Same as in cachenutd
export interface Device {
  deviceId: string;
  name: string;
  token: string;
  createDate: Date;
  manageDevice?: boolean;
}

export interface ActivationData {
  step: 'AccessCode' | 'LinkCode';
  accessCode: string;
  privateKey: CryptoKey;
  publicKey?: CryptoKey;
  sharedKey?: CryptoKey;
  firstHash?: string;
  secondHash?: string;
}

const STEP = 'activationStep';
const STEP_ACCESS_CODE = 'activationAccessCode';
const STEP_PRIVATE_KEY = 'activationPrivateKey';
const STEP_PUBLIC_KEY = 'activationPublicKey';
const STEP_SHARED_KEY = 'activationSharedKey';
const STEP_FIRST_HASH = 'activationFirstHash';
const STEP_SECOND_HASH = 'activationSecondHash';

const ACCOUNT_ID = 'accountId';
const ACCOUNT_DEVICE_ID = 'accountDeviceId';
const ACCOUNT_TOKEN = 'accountToken';
const ACCOUNT_CRYPTO_KEY = 'accountCryptoKey';

export interface ClipboardItemMeta {
  // accountId: string;
  deviceId: string;
  createTs: number;
  expiresAt?: Date;
  deviceName?: string;
}

export type ClipboardItem = ClipboardItemMeta & {content: ClipboardContent};

export interface ClipboardContent {
  type: 'image' | 'text' | 'url';
}

export type ClipboardUrlContent = {url: string} & ClipboardContent;
export type ClipboardTextContent = {text: string} & ClipboardContent;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getLocalStorage = () => browser.storage.local;

export const loadAccount = async (): Promise<CacheNutAccount> => {
  const accountItems = await getLocalStorage().get([ACCOUNT_ID, ACCOUNT_DEVICE_ID, ACCOUNT_TOKEN]);
  if (accountItems.accountId) {
    return {
      id: accountItems.accountId,
      deviceId: accountItems.accountDeviceId,
      token: accountItems.accountToken,
    };
  }
  return Promise.reject(new Error('No account'));
};

export const saveAccount = async (account: CacheNutAccount): Promise<boolean> =>
  getLocalStorage()
    .set({
      accountId: account.id,
      accountDeviceId: account.deviceId,
      accountToken: account.token,
    })
    .then(() => true)
    .catch(() => false);

export const resetAccount = async (): Promise<void> => getLocalStorage().clear();

export const loadCryptoKey = async (): Promise<CryptoKey | null> => {
  const keyItem = await getLocalStorage().get(ACCOUNT_CRYPTO_KEY);
  if (keyItem[ACCOUNT_CRYPTO_KEY]) {
    const c = crypto.subtle;
    return c.importKey(
      'jwk',
      JSON.parse(keyItem[ACCOUNT_CRYPTO_KEY]),
      'AES-GCM',
      true,
      [ 'encrypt', 'decrypt' ]
    );
  }
  return null;
};

export const saveCryptoKey = async (key: CryptoKey): Promise<boolean> => {
  const c = crypto.subtle;
  const keyJwk = await c.exportKey('jwk', key);

  return getLocalStorage()
    .set({accountCryptoKey: JSON.stringify(keyJwk)})
    .then(() => true)
    .catch(() => false);
};

export const loadActivationData = async (): Promise<ActivationData | null> => {
  const keyItem = await getLocalStorage().get([
    STEP,
    STEP_ACCESS_CODE,
    STEP_PRIVATE_KEY,
    STEP_PUBLIC_KEY,
    STEP_SHARED_KEY,
    STEP_FIRST_HASH,
    STEP_SECOND_HASH,
  ]);
  if (keyItem[STEP_ACCESS_CODE] && keyItem[STEP_PRIVATE_KEY]) {
    const c = crypto.subtle;
    const cryptoKey = await c.importKey(
      'jwk',
      JSON.parse(keyItem[STEP_PRIVATE_KEY]),
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      [ 'deriveKey' ]
    );
    const data: ActivationData = {
      step: keyItem[STEP],
      accessCode: keyItem[STEP_ACCESS_CODE],
      privateKey: cryptoKey,
    };
    for (const k of [ STEP_PUBLIC_KEY, STEP_SHARED_KEY, STEP_FIRST_HASH, STEP_SECOND_HASH ]) {
      if (keyItem[k]) {
        switch (k) {
          case STEP_PUBLIC_KEY:
            data.publicKey = await c.importKey(
              'jwk',
              JSON.parse(keyItem[STEP_PUBLIC_KEY]),
              { name: 'ECDH', namedCurve: 'P-256' },
              true,
              []
            );
            break;
          case STEP_SHARED_KEY:
            data.sharedKey = await c.importKey(
              'jwk',
              JSON.parse(keyItem[STEP_SHARED_KEY]),
              'AES-GCM',
              true,
              [ 'encrypt', 'decrypt' ]
            );
            break;
          case STEP_FIRST_HASH:
            data.firstHash = keyItem[STEP_FIRST_HASH];
            break;
          case STEP_SECOND_HASH:
            data.secondHash = keyItem[STEP_SECOND_HASH];
            break;
          default: // this should not occur
        }
      }
    }

    return data;
  }
  return null;
};

export const saveActivationData = async (data: ActivationData): Promise<boolean> => {
  const c = crypto.subtle;

  const dataToStore = {} as Record<string, string>;
  dataToStore[STEP] = data.step;
  dataToStore[STEP_ACCESS_CODE] = data.accessCode;
  dataToStore[STEP_PRIVATE_KEY] = JSON.stringify(await c.exportKey('jwk', data.privateKey));
  if (data.publicKey) {
    dataToStore[STEP_PUBLIC_KEY] = JSON.stringify(await c.exportKey('jwk', data.publicKey));
  }
  if (data.sharedKey) {
    dataToStore[STEP_SHARED_KEY] = JSON.stringify(await c.exportKey('jwk', data.sharedKey));
  }
  if (data.firstHash) {
    dataToStore[STEP_FIRST_HASH] = data.firstHash;
  }
  if (data.secondHash) {
    dataToStore[STEP_SECOND_HASH] = data.secondHash;
  }

  return getLocalStorage()
    .set(dataToStore)
    .then(() => true)
    .catch(() => false);
};

async function resetLocalStorageData(prefix: string): Promise<void> {
  return getLocalStorage()
    .get()
    .then(async (allData) => {
      const keys = Object.keys(allData).filter((k) => k.startsWith(prefix));
      return getLocalStorage().remove(keys);
    });
}

export const resetActivationData = async (): Promise<void> =>
  resetLocalStorageData('activation');
