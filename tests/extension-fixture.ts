import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { join } from 'path';

export const test = base.extend<{
  extensionURL: string;
  extensionContext: BrowserContext;
  newExtensionContext: BrowserContext;
  isExtensionTest: boolean;
}>({
  extensionURL: async ({ baseURL, extensionContext }, use) => {
    const isExtensionTest = !!process.env.TEST_EXTENSION;
    if (isExtensionTest) {
      // for manifest v3:
      let [background] = extensionContext.serviceWorkers();
      if (!background) {
        background = await extensionContext.waitForEvent('serviceworker');
      }

      const extensionId = background.url().split('/')[2];
      const chromeExtensionUrl = `chrome-extension://${extensionId}/popup.html`;
      await use(chromeExtensionUrl);
    }
    else {
      await use(baseURL);
    }
  },
  newExtensionContext: launchChromeWithExtension(),
  extensionContext: launchChromeWithExtension('test-results/.userDataDir'),
  // eslint-disable-next-line no-empty-pattern
  isExtensionTest: async ({ }, use) => {
    await use(!!process.env.TEST_EXTENSION);
  }
});

export const expect = test.expect;

function launchChromeWithExtension(dataDir: string = '') {
  return (async ({ context }, use) => {
    const isExtensionTest = !!process.env.TEST_EXTENSION;
    if (isExtensionTest) {
      const pathToExtension = join(__dirname, '..', 'extension', 'chrome');
      const chromeContext = await chromium.launchPersistentContext(dataDir, {
        headless: false,
        args: [
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      });
      await use(chromeContext);
      await chromeContext.close();
    }
    else {
      // not testing extension, so return normal context
      await use(context);
    }
  });
}