import { expect, test } from 'extension-fixture';
import { PRIMARY_STORAGE_DATA, PrimaryDevice, SECONDARY_STORAGE_DATA, SecondaryDevice } from "page-helper";

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
  + 'Cras tincidunt lectus a tellus posuere commodo. '
  + 'Vivamus ut massa at quam ornare porta at in leo.';

test('Insert content into clipboard history',
  async ({ baseURL, browser, extensionContext, extensionURL, isExtensionTest }) => {
    const primary = isExtensionTest
      ? new PrimaryDevice(await extensionContext.newPage(), extensionURL)
      : new PrimaryDevice(await browser.newPage({ storageState: PRIMARY_STORAGE_DATA }), baseURL);

    await primary.gotoHomePage();
    await primary.gotoCopyClipboardPage();
    // Copy Content page
    await primary.assertPageHeading('Paste from Clipboard');
    await expect(primary.button('Copy to CacheNut')).toBeEnabled();

    // Put content into input field
    const contentPasted = `(${Date.now()}) + ${LOREM}`;
    await primary.fillInput('Paste content here *', contentPasted, true);
    await primary.button('Copy to CacheNut').click();
    await primary.assertToastMessage('Copied.');
    await primary.button('Close').click();

    // Test blank content will not be copied
    await primary.fillInput('Paste content here *', '');
    await primary.button('Copy to CacheNut').click();
    await primary.assertToastMessage('Nothing copied.');
    await primary.button('Close').click();

    // Verify in clipboard history
    await primary.clickButton('back');
    await primary.assertPageHeading('Clipboard History');
    await expect(primary.page.locator('id=history_item_1').locator('p')).toHaveText(contentPasted);

    // Secondary device reads the content pasted
    const secondary = new SecondaryDevice(await browser.newPage({
      storageState: SECONDARY_STORAGE_DATA
    }), baseURL);

    await secondary.gotoHomePage();
    await secondary.assertPageHeading('Clipboard History');
    await expect(secondary.page.locator('id=history_item_1').locator('p')).toHaveText(contentPasted);
  }
);
