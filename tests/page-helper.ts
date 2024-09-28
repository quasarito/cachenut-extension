import { Page } from "@playwright/test";
import { expect } from "extension-fixture";
import { join } from 'path';

export const PRIMARY_STORAGE_DATA = join(__dirname, 'test-results/.auth/primary-storage.json');
export const SECONDARY_STORAGE_DATA = join(__dirname, 'test-results/.auth/secondary-storage.json');

export class PageHelper {
  constructor(public readonly page: Page) {}

  async assertLocalStorageKey(origin: string, key: string, value?: string) {
    const localStorage = await this.localStorage(origin);
    expect(localStorage).toBeDefined();
    const storageValue = localStorage.find(item => item.name === key)?.value;
    if (value !== undefined) {
      expect(storageValue).toStrictEqual(value);
    }
    else {
      expect(storageValue).toBeDefined();
    }
  }

  async assertLocalStorageKeyRemoved(origin: string, key: string) {
    const localStorage = await this.localStorage(origin);
    expect(localStorage).toBeDefined();
    const storageValue = localStorage.find(item => item.name === key)?.value;
    expect(storageValue).toBeUndefined();
  }

  async assertPageHeading(heading: string) {
    return expect(this.page.getByRole('heading', { name: heading })).toBeVisible();
  }

  async assertToastMessage(message: string) {
    return expect(this.page.getByRole('alert').getByText(message, { exact: true }))
      .toBeVisible();
  }

  async assertToastMessageClosed() {
    return expect(this.page.getByRole('alert')).toBeHidden();
  }

  async localStorage(origin: string) {
    return (await this.page.context().storageState())
      .origins.find(o => o.origin === origin)?.localStorage;
  }

  async localStorageValue(origin: string, key: string) {
    return (await this.page.context().storageState())
      .origins.find(o => o.origin === origin)
      ?.localStorage
      .find(item => item.name === key)?.value;
  }

  async isPageHeading(heading: string) {
    return this.page.getByRole('heading', { name: heading }).isVisible();
  }

  button(name: string) {
    return this.page.getByRole('button', { name });
  }

  async clickButton(name: string) {
    return this.page.getByRole('button', { name }).click();
  }

  async fillInput(fieldLabel: string, content: string, selectAll: boolean=false) {
    await this.page.getByLabel(fieldLabel).click();
    if (selectAll) {
      await this.page.getByLabel(fieldLabel).press('ControlOrMeta+a');
    }
    if (content) {
      await this.page.getByLabel(fieldLabel).pressSequentially(content);
    }
    else {
      await this.page.getByLabel(fieldLabel).fill(''); // clear input field
    }
  }
}

class BaseDevice extends PageHelper {
  constructor(readonly page: Page, readonly home: string) {
    super(page);
  }

  async gotoHomePage() {
    await this.page.goto(this.home);
  }

  async gotoAccountPage() {
    const isHome = await this.isPageHeading('Clipboard History');
    if (!isHome) {
      await this.gotoHomePage();
    }
    await this.assertPageHeading('Clipboard History')
    await this.clickButton('menu');
    await this.clickButton('Account');
  }

  async gotoCopyClipboardPage() {
    const isHome = await this.isPageHeading('Clipboard History');
    if (!isHome) {
      await this.gotoHomePage();
    }
    await this.assertPageHeading('Clipboard History')
    await this.clickButton('menu');
    await this.clickButton('Copy clipboard content');
  }

  async copyContent(content: string) {
    await this.gotoCopyClipboardPage();
    await this.fillInput('Paste content here *', content, true);
    await this.clickButton('Copy to CacheNut');
    await this.page.getByLabel('Close').click(); // toast popup
  }
}

export class PrimaryDevice extends BaseDevice {
  /**
   * Connects a device to a new account.
   */
  async register(deviceName: string) {
    await this.gotoHomePage();
    // Unregistered page
    await this.assertPageHeading('Cache Nut Account');
    await expect(this.button('Connect to another device'))
      .toBeEnabled();
    await this.clickButton('Register this device');
    // New Account page
    await expect(this.button('back')).toBeEnabled();
    await this.page.getByLabel('Device name').click();
    await this.page.getByLabel('Device name').press('ControlOrMeta+a');
    await this.page.getByLabel('Device name').fill(deviceName);
    await this.clickButton('Register');
    await expect(this.button('back')).toBeDisabled();
    await expect(this.button('Register')).toBeDisabled();
    await this.assertToastMessage('Account created.');
    await this.page.getByLabel('Close').click(); // toast popup
  }

  /**
   * Prepares to connect a secondary device to this device's account.
   * 
   * @returns the access code to be entered when connecting the secondary device.
   */
  async addSecondaryDevice() {
    await this.gotoAccountPage();
    await this.clickButton('Add a new device');
    await expect(this.page.locator('id=access_code')).toHaveText(/^[A-Z]{3}\s-\s[A-Z]{3}$/);
    await expect(this.button('back')).toBeEnabled();
    await expect(this.button('Cancel')).toBeEnabled();

    return this.page.locator('id=access_code').textContent();
  }

  async authorizeSecondaryDevice(linkCode: string) {
    const isAccessCodePage = await this.isPageHeading('Access Code');
    if (isAccessCodePage) {
      await this.clickButton('Next');
    }
    await this.assertPageHeading('Add Device');
    await this.page.getByLabel('Link code').click();
    await this.page.getByLabel('Link code').press('ControlOrMeta+a');
    await this.page.getByLabel('Link code').fill(linkCode);
    await this.clickButton('Authorize');

    await this.assertPageHeading('Finish');
    await this.clickButton('Done');
  }
}

export class SecondaryDevice extends BaseDevice {
  /**
   * Connects a new device to an existing account.
   * 
   * @param accessCode the access code provided by the primary device
   * @returns the link code to be entered in the primary device
   */
  async connect(accessCode: string) {
    await this.gotoHomePage();
    // Unregistered page
    await this.clickButton('Connect to another device');
    // Connect Account page
    await expect(this.button('Connect')).toBeDisabled();
    await this.page.getByLabel('Access code').click();
    await this.page.getByLabel('Access code').fill(accessCode);
    await this.clickButton('Connect');
    // Link Code page
    await expect(this.page.locator('id=link_code'))
      .toHaveText(/^(?:[A-Z0-9]{4}\s-\s){3}[A-Z0-9]{4}$/);
      await expect(this.button('Cancel')).toBeEnabled();  
    await expect(this.button('Next')).toBeEnabled();

    return this.page.locator('id=link_code').textContent();
  }

  /**
   * Completes the secondary device connection.
   * 
   * @param deviceName the device label
   */
  async finishConnect(deviceName: string, assertSuccess: boolean=true) {
    const isLinkCodePage = await this.isPageHeading('Link Code');
    if (isLinkCodePage) {
      await this.clickButton('Next');
    }
    await this.assertPageHeading('Finish');
    await expect(this.button('Cancel')).toBeEnabled();
    await this.page.getByLabel('Name to identify this device').click();
    await this.page.getByLabel('Name to identify this device').press('ControlOrMeta+a');
    await this.page.getByLabel('Name to identify this device').fill(deviceName);
    await this.clickButton('Done');

    if (assertSuccess) {
      await expect(this.button('Cancel')).toBeDisabled();
      await expect(this.button('Done')).toBeDisabled();
      await this.assertToastMessage('Connected.');
  
      await this.page.getByLabel('Close').click(); // toast popup
    }
  }
}

/**
 * Returns the origin of a http(s) URL, aka, the scheme and host.
 * eg: http://example.com
 * 
 * @param baseUrl an http or https url
 * @returns the http scheme and host, or null if not a http/https url
 */
export function getUrlOrigin(baseUrl: string) {
  const result = /^https?:\/\/[\w.]+/.exec(baseUrl);
  return result ? result[0] : null;
}
