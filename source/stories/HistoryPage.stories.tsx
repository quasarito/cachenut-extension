import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {HistoryController, HistoryPage} from '../Popup/HistoryPage';

export default {
  title: 'Example/HistoryPage',
  component: HistoryPage,
} as Meta;

const Template: StoryFn = ({itemsExpireIn, minutesToExpire}) => {
  const mock: HistoryController = {
    loadClipboardItems: async () => {
      return itemsExpireIn.map(expireIn => {
        const fItem = Math.random() < 0.33
          ? urlItem
          : (Math.random() < 0.50 ? textItem : imageItem);
        return fItem(minutesToExpire - expireIn, expireIn);
      });
    }    
  };
  // Note: set IS_EXTENSION_BUILD in main.ts to toggle extension/webapp view
  return <HistoryPage mock={mock} />;
};

export const Page = Template.bind({});

function createdAgo(minutes: number) { return Date.now() - (minutes*60*1000); }
function expiresIn(minutes: number) { return Date.now() + (minutes*60*1000) + 5000; }

function urlItem(createdAgoMin: number, expiresInMin: number) {
  return {
    "deviceId": "1f7d9a33-fb77-41eb-98a7-03db13f8394d",
    "deviceName": "Brave on M1 Air",
    "createTs": createdAgo(createdAgoMin),
    "expiresAt": expiresIn(expiresInMin),
    "content": {
      "type": "url",
      "url": `https://example.com/${expiresInMin}/guide.html`
    }
  };
}

function textItem(createdAgoMin: number, expiresInMin: number) {
  return {
    "deviceId": "1f7d9a33-fb77-41eb-98a7-03db13f8394d",
    "deviceName": "Brave on M1 Air",
    "createTs": createdAgo(createdAgoMin),
    "expiresAt": expiresIn(expiresInMin),
    "content": {
      "type": "text",
      "text": `${expiresInMin} Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
    }
  };
}

function imageItem(createdAgoMin: number, expiresInMin: number) {
  return {
    "deviceId":"1f7d9a33-fb77-41eb-98a7-03db13f8394d",
    "deviceName":"Brave on M1 Air",
    "createTs": createdAgo(createdAgoMin),
    "expiresAt": expiresIn(expiresInMin),
    "content":{
      "type": "image",
      "url": "https://commons.wikimedia.org/wiki/Category:Astronomy#/media/File:Planet_HD_220074_b.png"}
  };
}

// [{"_id":"625e13448c79880630babbfa","accountId":"f0b5aa1c-0acc-47b9-9baf-fa90dcffa390","content":{"ciphertext":"f65oIYPW26T1YZRKukdGIUgyQuP7zDNW4IdHA/dKtbfjdZIQkecCdRJylCR8tBoAX5fUVvp09WXLA9kFdxpjurvPZ1Rusolue6sTd5N+XHt7mFz0n71L6D/qKj2X8aEs8xc73pjh","nonce":"CTKsNOFWQTO1vF/L"},"createTs":1650332484476,"deviceId":"1f7d9a33-fb77-41eb-98a7-03db13f8394d","expiresAt":"2022-04-19T02:11:24.476Z","__v":0,"deviceName":"Brave on M1 Air"},{"_id":"625e136c8c79880630babbfb","accountId":"f0b5aa1c-0acc-47b9-9baf-fa90dcffa390","content":{"ciphertext":"01+iYISX9O8/gihmcij0azbSsFHkLHQVoznUbt5fbWA7uYfE+4vSOOd3F9GfCTq3ubOK+smPCzf3EstOYUjDPPpY8dcDAcVUBrLBnX7KkYc0JkYI0+UCJgbGG9xANLnj2v0sfNnKrG9/qcYV7/BzwaI58qxcSW3AfwSVwXK9aj0nsZG+vWlqwrqEYtw2J+LGCvhCW+2i/y4QW47wdjvztcmQw41yo5GmpYaZkcfcku5OjLLwqSXjk+/xd3P8MMKfwktkRpDcMMbQlSBJr60421nfqkTL1+FboOYNz/csa3IKEQZhTSLwSMupEEtCJQHScN2gl+xa3RciBMaGgsBGdJnox6LWKzBswGARQfO26ZLdbKSwNEX7Fg==","nonce":"bbryU0rskwfd/EqC"},"createTs":1650332524994,"deviceId":"1f7d9a33-fb77-41eb-98a7-03db13f8394d","expiresAt":"2022-04-19T02:12:04.994Z","__v":0,"deviceName":"Brave on M1 Air"}]
Page.args = {
  itemsExpireIn: [10, 13, 7],
  minutesToExpire: 30,
};
