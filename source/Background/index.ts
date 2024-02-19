/* eslint-disable @typescript-eslint/no-explicit-any */
import UAParser from 'ua-parser-js';
import browser, { Menus } from 'webextension-polyfill';

import { createHttpClient } from '../CacheNut/HttpClient';
import { ClipboardContent, loadAccount } from '../CacheNut/Model';
import { Logger } from '../CacheNut/Support';

const logger = Logger('BackgroundIndex');

function copyClicked(info: Menus.OnClickData): void {
  logger.log('copyMenuClicked info=', info);
  let copyItem: any;
  if (info.menuItemId === 'copyImageUrlMenuId') {
    copyItem = {
      type: 'image',
      url: info.srcUrl,
    };
    logger.log('imageClicked');
  }
  if (info.menuItemId === 'copyTextMenuId') {
    copyItem = {
      type: 'text',
      text: info.selectionText,
    };
    logger.log('selectionClicked');
  }
  if (info.menuItemId === 'copyLinkMenuId') {
    copyItem = {
      type: 'url',
      // text: info.linkText, // FF only
      url: info.linkUrl,
    };
    logger.log('linkClicked');
  }

  logger.log('copyContent=', copyItem);
  if (copyItem) {
    createHttpClient()
    .then((client) => {
      client.cache(copyItem)
      .catch((err) => {
        logger.log('Copy error=', err);
      });
    });
  }
}

function pasteClicked(info: Menus.OnClickData): void {
  logger.log('pasteMenuClicked: info=', info);
  if (info.menuItemId === 'pasteMenuId') {
    if (info.editable) {
      logger.log('editableClicked');
    }
  }
}

async function copySystemClipboard(): Promise<unknown> {
  if (navigator.clipboard) {
    return navigator.clipboard.readText().then(async (content) => {
      const item: any = {};
      if (/^https?:\/\/[a-zA-Z0-9]/.test(content)) {
        item.type = 'url';
        item.url = content;
      }
      else {
        item.type = 'text';
        item.text = content;
      }
      logger.log('Clipboard content copied: ', item);
      return createHttpClient()
      .then(async (client) => client.cache(item as ClipboardContent));
    });
  }
  return Promise.reject(new Error('Clipboard access not available'));
}

function initContextMenus(): void {
  logger.log('Initializing context menus');

  const isFF = new UAParser().getBrowser().name === 'Firefox';
  // COPY
  browser.contextMenus.create({
    id: 'copyImageUrlMenuId',
    title: 'Copy image URL to Cache Nut',
    contexts: ['image'], // .srcUrl, .mediaType="image"
  });
  browser.contextMenus.create({
    id: 'copyLinkMenuId',
    title: 'Copy link to Cache Nut',
    contexts: ['link'], // .linkText, .linkUrl
  });
  browser.contextMenus.create({
    id: 'copyTextMenuId',
    title: 'Copy text to Cache Nut',
    contexts: ['selection'], // .selectionText
  });
  // FF-only
  if (isFF) {
    browser.contextMenus.create({
      id: 'copyBookmarkMenuId',
      title: 'Copy url to Cache Nut',
      contexts: ['bookmark', 'tab'],
    });
  }

  // PASTE
  browser.contextMenus.create({
    id: 'pasteMenuId',
    title: 'Paste from Cache Nut',
    contexts: ['editable'], // .editable=true
  });
  // FF-only
  if (isFF) {
    browser.contextMenus.create({
      id: 'pastePasswordMenuId',
      title: 'Overwrite from Cache Nut',
      contexts: ['password'],
    });
  }

  logger.log('Context menus initialized');
}

browser.contextMenus.onClicked.addListener((info) => {
  copyClicked(info);
  pasteClicked(info);
});

function handleMessage(message: any): Promise<any> {
  if (message.event === 'linked') {
    logger.log('handleMessage: linked');
    return browser.contextMenus.removeAll()
    .then(() => {
      initContextMenus();
    });
  }
  if (message.event === 'unlinked') {
    logger.log('handleMessage: unlinked');
    return browser.contextMenus.removeAll()
    .then(() => {});
  }
  if (message.event === 'copyclipboard') {
    return copySystemClipboard()
    .then(() => true)
    .catch((err) => {
      logger.log('System clipboard copy error:', err);
      return false;
    });
  }
  return Promise.resolve();
}

browser.runtime.onMessage.addListener(handleMessage);

function launch(): void {
  loadAccount()
  .then(() => {
    return browser.contextMenus.removeAll()
    .then(() => {
      initContextMenus();
    });
  })
  .catch(() => logger.log('No Cache Nut account'));
}

browser.runtime.onInstalled.addListener(() => {
  console.info('Cache Nut extension installed');
});

launch();
