import { expect, test as setup } from 'extension-fixture';
import {
  getUrlOrigin,
  PRIMARY_STORAGE_DATA,
  PrimaryDevice,
  SECONDARY_STORAGE_DATA,
  SecondaryDevice,
} from 'page-helper';

setup.describe.configure({ mode: 'serial' });

setup('Register primary device', async ({ baseURL, extensionContext, extensionURL, isExtensionTest, page }) => {
  const pageOrigin = getUrlOrigin(baseURL);
  await expect(pageOrigin).toBeDefined();

  const primary = isExtensionTest
    ? new PrimaryDevice(await extensionContext.newPage(), extensionURL)
    : new PrimaryDevice(page, baseURL);
  await primary.register('Primary device test');

  // Should be at Accounts page
  primary.assertPageHeading('Account Info');
  if (!isExtensionTest) {
    // Verify that local storage contains the account id and device id
    const pageLocalStorage = await primary.localStorage(pageOrigin);
    expect(pageLocalStorage).toBeDefined();
    await expect(primary.page.locator('id=account_id'))
      .toHaveText(pageLocalStorage.find(item => item.name === 'accountId')?.value);
    await expect(primary.page.locator('id=device_id'))
      .toHaveText(pageLocalStorage.find(item => item.name === 'accountDeviceId')?.value);

    // Dump the storage data
    await primary.page.context().storageState({ path: PRIMARY_STORAGE_DATA });
  }

  // Navigate to Manage Devices page, and validate device appears in list
  await primary.clickButton('Manage devices');
  await primary.assertPageHeading('Manage Devices');
  await expect(primary.page.locator('id=device_item_0 >> css=span'))
    .toContainText('Primary device test');
});

setup('Register secondary device', async ({ baseURL, browser, extensionContext, extensionURL, isExtensionTest }) => {
  const pageOrigin = getUrlOrigin(baseURL);
  await expect(pageOrigin).toBeDefined();

  if (isExtensionTest) {
    await expect(extensionURL.substring(0, extensionURL.indexOf(':'))).toStrictEqual('chrome-extension');
  }

  const primary = isExtensionTest
    ? new PrimaryDevice(await extensionContext.newPage(), extensionURL)
    : new PrimaryDevice(await browser.newPage({ storageState: PRIMARY_STORAGE_DATA }), baseURL);
  const secondary = new SecondaryDevice(await browser.newPage(), baseURL);

  const accessCode = await primary.addSecondaryDevice();
  const linkCode = await secondary.connect(accessCode);
  await primary.authorizeSecondaryDevice(linkCode);
  await secondary.finishConnect('Secondary device test');

  // Secondary device should be at Accounts page
  await secondary.assertPageHeading('Account Info');
  // Verify that local storage contains the account id and device id
  const secondaryStorageState = await secondary.page.context().storageState();
  const secondaryLocalStorage = secondaryStorageState.origins
    .find(origin => origin.origin === pageOrigin)?.localStorage;
  await expect(secondary.page.locator('id=account_id'))
    .toHaveText(secondaryLocalStorage.find(item => item.name === 'accountId')?.value)
  await expect(secondary.page.locator('id=device_id'))
    .toHaveText(secondaryLocalStorage.find(item => item.name === 'accountDeviceId')?.value)

  // Navigate to Manage Devices page, and validate device appears in list
  await secondary.clickButton('Manage devices');
  await secondary.assertPageHeading('Manage Devices');
  await expect(secondary.page.locator('id=device_item_0 >> css=span'))
    .toContainText('Primary device test');
  await expect(secondary.page.locator('id=device_item_1 >> css=span'))
    .toContainText('Secondary device test');

  // Dump the storage data
  await secondary.page.context().storageState({ path: SECONDARY_STORAGE_DATA });
});
