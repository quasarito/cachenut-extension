import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {HistoryController, HistoryPage} from '../Popup/HistoryPage';

export default {
  title: 'Example/HistoryPage',
  component: HistoryPage,
} as Meta;

const Template: StoryFn = ({itemsJson}) => {
  const mock: HistoryController = {
    loadClipboardItems: async () => {
      return itemsJson;
    }    
  };  
  return <HistoryPage mock={mock} />;
};

export const Page = Template.bind({});

function expiresIn(minutes: number) { return Date.now() + (minutes*60*1000) + 5000; }
// [{"_id":"625e13448c79880630babbfa","accountId":"f0b5aa1c-0acc-47b9-9baf-fa90dcffa390","content":{"ciphertext":"f65oIYPW26T1YZRKukdGIUgyQuP7zDNW4IdHA/dKtbfjdZIQkecCdRJylCR8tBoAX5fUVvp09WXLA9kFdxpjurvPZ1Rusolue6sTd5N+XHt7mFz0n71L6D/qKj2X8aEs8xc73pjh","nonce":"CTKsNOFWQTO1vF/L"},"createTs":1650332484476,"deviceId":"1f7d9a33-fb77-41eb-98a7-03db13f8394d","expiresAt":"2022-04-19T02:11:24.476Z","__v":0,"deviceName":"Brave on M1 Air"},{"_id":"625e136c8c79880630babbfb","accountId":"f0b5aa1c-0acc-47b9-9baf-fa90dcffa390","content":{"ciphertext":"01+iYISX9O8/gihmcij0azbSsFHkLHQVoznUbt5fbWA7uYfE+4vSOOd3F9GfCTq3ubOK+smPCzf3EstOYUjDPPpY8dcDAcVUBrLBnX7KkYc0JkYI0+UCJgbGG9xANLnj2v0sfNnKrG9/qcYV7/BzwaI58qxcSW3AfwSVwXK9aj0nsZG+vWlqwrqEYtw2J+LGCvhCW+2i/y4QW47wdjvztcmQw41yo5GmpYaZkcfcku5OjLLwqSXjk+/xd3P8MMKfwktkRpDcMMbQlSBJr60421nfqkTL1+FboOYNz/csa3IKEQZhTSLwSMupEEtCJQHScN2gl+xa3RciBMaGgsBGdJnox6LWKzBswGARQfO26ZLdbKSwNEX7Fg==","nonce":"bbryU0rskwfd/EqC"},"createTs":1650332524994,"deviceId":"1f7d9a33-fb77-41eb-98a7-03db13f8394d","expiresAt":"2022-04-19T02:12:04.994Z","__v":0,"deviceName":"Brave on M1 Air"}]
Page.args = {
  itemsJson: [
    {
      "deviceId":"1f7d9a33-fb77-41eb-98a7-03db13f8394d",
      "deviceName":"Brave on M1 Air",
      "createTs":1650332484476,
      "expiresAt": expiresIn(3),
      "content":{"type":"url","url":"https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html"}
    },{
      "deviceId":"1f7d9a33-fb77-41eb-98a7-03db13f8394d",
      "deviceName":"Brave on M1 Air",
      "createTs":1650332524994,
      "expiresAt": expiresIn(7),
      "content":{"type":"text","text":"As we shared in the release post, React 18 introduces features powered by our new concurrent renderer, with a gradual adoption strategy for existing applications. In this post, we will guide you through the steps for upgrading to React 18."}
    }
  ]
};
