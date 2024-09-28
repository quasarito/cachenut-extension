import { expect, test } from 'extension-fixture';
import { getUrlOrigin, PRIMARY_STORAGE_DATA, PrimaryDevice, SecondaryDevice } from "page-helper";

// Primary device journeys
test('Unregistered primary device',
  async ({ baseURL, newExtensionContext, extensionURL, isExtensionTest, page }) => {
    const primary = isExtensionTest
      ? new PrimaryDevice(await newExtensionContext.newPage(), extensionURL)
      : new PrimaryDevice(page, baseURL);
    
    await primary.gotoHomePage();
    // Unregistered page
    await primary.assertPageHeading('Cache Nut Account');
    await expect(primary.button('Connect to another device'))
      .toBeEnabled();
    await primary.clickButton('Register this device');
    // New Account page
    await primary.assertPageHeading('New Account');
    await expect(primary.button('back')).toBeEnabled();
    await primary.button('back').click();
    // Back to Unregistered page
    await primary.assertPageHeading('Cache Nut Account');
    await expect(primary.button('Register this device'))
      .toBeEnabled();
    await expect(primary.button('Connect to another device'))
      .toBeEnabled();
  }
);

test('Cancel add new device journey at access code page',
  async ({ baseURL, browser, extensionContext, extensionURL, isExtensionTest }) => {
    const primary = isExtensionTest
      ? new PrimaryDevice(await extensionContext.newPage(), extensionURL)
      : new PrimaryDevice(await browser.newPage({ storageState: PRIMARY_STORAGE_DATA }), baseURL);

    // Navigates to Access Code page
    const accessCode = await primary.addSecondaryDevice();
    await primary.clickButton('back');
    // Back to Account Info page
    primary.assertPageHeading('Account Info');
    // Clicking 'Add a new device' button should show Access Code page with same code
    primary.clickButton('Add a new device');
    await expect(primary.page.locator('id=access_code')).toHaveText(accessCode);
    // Back to Account Info page
    await primary.clickButton('back');
    await primary.assertPageHeading('Account Info');
    // Reload the site and it will go directly to the Access Code page
    await primary.gotoHomePage();
    await primary.assertPageHeading('Access Code');
    // Cancel the journey
    await primary.clickButton('Cancel');
    await primary.assertToastMessage('Cancel adding device?');
    await primary.clickButton('No'); // abort the cancel
    await primary.assertToastMessageClosed();
    await primary.clickButton('Cancel');
    await primary.clickButton('Yes'); // accept the cancel
    if (!isExtensionTest) {
      await primary.assertPageHeading('Clipboard History');
      await primary.assertLocalStorageKeyRemoved(getUrlOrigin(baseURL), 'activationAccessCode');
    }
  }
);

test('Cancel add new device journey at add device page',
  async ({ baseURL, browser, extensionContext, extensionURL, isExtensionTest }) => {
    const primary = isExtensionTest
      ? new PrimaryDevice(await extensionContext.newPage(), extensionURL)
      : new PrimaryDevice(await browser.newPage({ storageState: PRIMARY_STORAGE_DATA }), baseURL);

    // Navigates to Access Code page
    await primary.addSecondaryDevice();
    await primary.clickButton('Next');
    // Add Device page
    await primary.assertPageHeading('Add Device');
    // Try invalid link code
    await primary.fillInput('Link code', 'foobar');
    await primary.clickButton('Authorize');
    await primary.assertToastMessage('Invalid link code.');
    await primary.clickButton('Close'); // close the toast message
    // Reload the site and it will go directly to the Access Code page
    await primary.gotoHomePage();
    await primary.assertPageHeading('Access Code');
    await primary.clickButton('Next');
    // Cancel the journey
    await primary.clickButton('Cancel');
    await primary.assertToastMessage('Quit adding device?');
    await primary.clickButton('No'); // abort the cancel
    await primary.assertToastMessageClosed();
    await primary.clickButton('Cancel');
    await primary.clickButton('Yes'); // accept the cancel
    if (!isExtensionTest) {
      await primary.assertPageHeading('Clipboard History');
      await primary.assertLocalStorageKeyRemoved(getUrlOrigin(baseURL), 'activationAccessCode');
    }
  }
);

// Secondary device journeys
test('Cancel connect to a device journey at connect account page', async ({ baseURL, browser }) => {
  const secondary = new SecondaryDevice(await browser.newPage(), baseURL);

  await secondary.gotoHomePage();
  await secondary.clickButton('Connect to another device');
  // Connect Account page
  await secondary.assertPageHeading('Connect Account');
  // Try invalid access code
  await secondary.fillInput('Access code', "foobar");
  await secondary.clickButton('Connect');
  await secondary.assertToastMessage('Incorrect access code.');
  await secondary.clickButton('Close'); // close the toast message
  // Back to start page
  await secondary.clickButton('back');
  await secondary.assertPageHeading('Cache Nut Account');
  await expect(secondary.button('Register this device'))
    .toBeEnabled();
  await expect(secondary.button('Connect to another device'))
    .toBeEnabled();
});

test('Cancel connect to a device journey at link code page',
  async ({ baseURL, browser, extensionContext, extensionURL, isExtensionTest }) => {
    const pageOrigin = getUrlOrigin(baseURL);
    await expect(pageOrigin).toBeDefined();

    const primary = isExtensionTest
      ? new PrimaryDevice(await extensionContext.newPage(), extensionURL)
      : new PrimaryDevice(await browser.newPage({ storageState: PRIMARY_STORAGE_DATA }), baseURL);
    const secondary = new SecondaryDevice(await browser.newPage(), baseURL);

    const accessCode = await primary.addSecondaryDevice();
    await secondary.connect(accessCode);
    await secondary.assertPageHeading('Link Code');
    // Reload the site and it will go directly to the Link Code page
    await secondary.gotoHomePage();
    await secondary.assertPageHeading('Link Code');
    // Cancel the journey
    await secondary.clickButton('Cancel');
    await secondary.assertToastMessage('Quit account connection?');
    await secondary.clickButton('No'); // abort the cancel
    await secondary.assertToastMessageClosed();
    await secondary.clickButton('Cancel');
    await secondary.clickButton('Yes'); // accept the cancel
    await secondary.assertPageHeading('Cache Nut Account'); // unregistered page
    if (isExtensionTest) {
      // Cancel the journey on primary as well
      await primary.clickButton('Cancel');
      await primary.assertToastMessage('Cancel adding device?');
      await primary.clickButton('Yes'); // accept the cancel  
    }
  }
);

test('Cancel connect to a device journey at device name page',
  async ({ baseURL, browser, extensionContext, extensionURL, isExtensionTest }) => {
    const pageOrigin = getUrlOrigin(baseURL);
    await expect(pageOrigin).toBeDefined();

    const primary = isExtensionTest
      ? new PrimaryDevice(await extensionContext.newPage(), extensionURL)
      : new PrimaryDevice(await browser.newPage({ storageState: PRIMARY_STORAGE_DATA }), baseURL);
    const secondary = new SecondaryDevice(await browser.newPage(), baseURL);

    const accessCode = await primary.addSecondaryDevice();
    await secondary.connect(accessCode);
    // Note: at this point, the primary device has not authorized the connection
    // Attempting to complete the journey will fail
    await secondary.finishConnect('Secondary device test', false);
    await secondary.assertToastMessage('You must complete authorization on the other device first.');
    await secondary.clickButton('Close');
    await secondary.assertToastMessageClosed();
    // Cancel the journey
    await secondary.clickButton('Cancel');
    await secondary.assertToastMessage('Quit account connection?');
    await secondary.clickButton('No'); // abort the cancel
    await secondary.assertToastMessageClosed();
    await secondary.clickButton('Cancel');
    await secondary.clickButton('Yes'); // accept the cancel
    await secondary.assertPageHeading('Cache Nut Account'); // unregistered page
    if (isExtensionTest) {
      // Cancel the journey on primary as well
      await primary.clickButton('Cancel');
      await primary.assertToastMessage('Cancel adding device?');
      await primary.clickButton('Yes'); // accept the cancel  
    }
  }
);
