import {Config} from './Config';
import { decryptPayload, EncryptedClipboardItem, EncryptedPayload, encryptPayload, KeyPayload } from './Crypto';
import { CacheNutAccount, ClipboardContent, ClipboardItem, Device, loadAccount, loadCryptoKey } from './Model';

const BASE_URL = Config.baseUrl;

// Same as in cachenutd
interface AccountItem {
  accountId: string;
  createDate: Date;
  devices: Device[];
}

export interface AccountAuth {
  accountId: string;
  key: JsonWebKey;
}

export interface CacheNutResponse<T> {
  json: T;
  headers: Headers;
  response: Response;
}

class CacheNutHttpClientError<T> extends Error {
  constructor(readonly status: number, readonly body: T) {
    super();
  }
}

function url(path: string): string {
  return BASE_URL + (path.startsWith('/') ? path : `/${path}`);
}

async function handleResponse<T>(resp: Response): Promise<CacheNutResponse<T>> {
  if (resp.ok) {
    if (resp.status === 204) {
      return {
        json: {} as T,
        headers: resp.headers,
        response: resp,
      };
    }
    return {
      json: (await resp.json()) as T,
      headers: resp.headers,
      response: resp,
    };
  }
  const json = await resp.json();
  throw new CacheNutHttpClientError(resp.status, json);
}

async function doHttpGet<T>(reqUrl: string, headers?: Record<string, string>, methodType?: string):
  Promise<CacheNutResponse<T>>
{
  if (headers || methodType) {
    return fetch(reqUrl, {
      method: methodType || 'GET',
      headers: headers || {},
    }).then(async (r) => handleResponse<T>(r));
  }
  return fetch(reqUrl).then(async (r) => handleResponse<T>(r));
}

async function doHttpPost<T>(reqUrl: string, body: unknown, headers?: Record<string, string>, methodType?: string):
  Promise<CacheNutResponse<T>>
{
  const h = headers || ({} as Record<string, string>);
  h['Content-Type'] = 'application/json';

  return fetch(reqUrl, {
    method: methodType || 'POST',
    headers: h,
    body: typeof body === 'object' ? JSON.stringify(body) : (body as BodyInit),
  })
  .then(async (r) => handleResponse<T>(r));
}

export class CacheNutHttpClient {
  constructor(
    private readonly accessId: string,
    private readonly token: string,
    private readonly key: CryptoKey
  ) {}

  async loadDeviceList(): Promise<Device[]> {
    const { json } = await this.doHttpGetWithAuth<Device[]>(url('accounts/manage/devices'));
    return json;
  }

  async updateDevice(deviceId: string,fields: {manageDevice: boolean}): Promise<boolean> {
    const response =
      await this.doHttpPostWithAuth(url(`accounts/manage/devices/${deviceId}`), fields, undefined, 'PUT');
    return response.response.status >= 200 && response.response.status < 300;
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    const response = await this.doHttpGetWithAuth(url(`accounts/manage/devices/${deviceId}`), undefined, 'DELETE');
    return response.response.status >= 200 && response.response.status < 300;
  }

  async syncDeviceInfo(): Promise<Device> {
    const { json } = await this.doHttpGetWithAuth<Device>(url('accounts/manage/devices/current'));
    return json;
  }

  async list(): Promise<ClipboardItem[]> {
    const { json } = await this.doHttpGetWithAuth<EncryptedClipboardItem[]>(url('clipboard'));
    return Promise.all(
      json.map(async (item) =>
        decryptPayload<ClipboardContent>(this.key, item.content).then(
          (payload) => {
            const { deviceId, deviceName, createTs } = item;
            return { deviceId, deviceName, createTs, content: payload };
          }
        )
      )
    );
  }

  async lastUpdated(): Promise<string | null> {
    const { headers } = await this.doHttpGetWithAuth(url('clipboard'), {}, 'HEAD');
    return headers.get('Last-Modified');
  }

  async cache(content: ClipboardContent): Promise<unknown> {
    const encryptedBody = await encryptPayload(this.key, content);
    const {json} = await this.doHttpPostWithAuth(
      url('clipboard'),
      encryptedBody
    );
    return json;
  }

  async doHttpGetWithAuth<T>(reqUrl: string, headers?: Record<string, string>, methodType?: string):
    Promise<CacheNutResponse<T>>
  {
    const h = headers || {};
    h['X-CacheNut-Account'] = this.accessId;
    h['X-CacheNut-Token'] = this.token;

    return doHttpGet<T>(reqUrl, h, methodType);
  }

  async doHttpPostWithAuth<T>(reqUrl: string, body: unknown, headers?: Record<string, string>, methodType?: string):
    Promise<CacheNutResponse<T>>
  {
    const h = headers || ({} as Record<string, string>);
    h['X-CacheNut-Account'] = this.accessId;
    h['X-CacheNut-Token'] = this.token;

    return doHttpPost<T>(reqUrl, body, h, methodType);
  }
}

export const createHttpClient = async (): Promise<CacheNutHttpClient> => {
  const account = await loadAccount();
  const key = await loadCryptoKey();

  if (account && key) {
    return new CacheNutHttpClient(account.id, account.token, key);
  }
  return Promise.reject(new Error('No account.'));
};

export const requestAccessCode = async (payload: KeyPayload): Promise<string> => {
  const { json } = await doHttpPost<{code: string}>(url('accounts/code'), payload);
  return json.code;
};

export const register = async (deviceName: string, accountId?: string): Promise<CacheNutAccount> => {
  const postBody: Record<string, string> = deviceName?.trim() ? {deviceName} : {};
  if (accountId) {
    postBody.accountId = accountId;
  }
  const { json } = await doHttpPost<AccountItem>(url('accounts/register'), postBody);

  const accountData: CacheNutAccount = {
    id: json.accountId,
    deviceId: json.devices[0].deviceId,
    token: json.devices[0].token,
  };
  return accountData;
};

// Secondary device submits its PK, and gets the primary's PK.
export const exchangeLinkKey = async (accessCode: string, payload: KeyPayload): Promise<KeyPayload> => {
  const { json } = await doHttpPost(url(`accounts/code/${accessCode}`), payload);
  return json as KeyPayload;
};

// Primary gets the secondary's PK.
export const fetchLinkKey = async (accessCode: string): Promise<KeyPayload> => {
  const { json } = await doHttpGet(url(`accounts/code/${accessCode}`));
  return json as KeyPayload;
};

export const postAccountAuth = async (accessCode: string, body: AccountAuth, key: CryptoKey): Promise<void> => {
  const encryptedBody = await encryptPayload(key, body);
  await doHttpPost(url(`accounts/code/${accessCode}/aux`), encryptedBody);
};

export const getAccountAuth = async (accessCode: string, key: CryptoKey): Promise<AccountAuth> => {
  const { json } = await doHttpGet<EncryptedPayload>(url(`accounts/code/${accessCode}/aux`));
  const accountAuth = await decryptPayload(key, json);
  return accountAuth as AccountAuth;
};
