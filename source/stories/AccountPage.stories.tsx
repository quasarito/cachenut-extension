import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {AccountPage, AccountPageController} from '../Popup/AccountPage';

export default {
  title: 'Example/AccountPage',
  component: AccountPage,
} as Meta;

const Template: StoryFn = ({account, deviceCount, delayMillis, disconnectError}) => {
  const mock: AccountPageController = {
    getAccount: async () => Promise.resolve(account),
    getDeviceList: async () => Promise.resolve(deviceCount),
    disconnect: async () => new Promise((resolve, reject) => {
      setTimeout(() => disconnectError ? reject() : resolve(), delayMillis || 0);
    })
  };
  return <AccountPage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  account: {
    id: '5F8C2F27-64DD-4BF5-98C7-3C610922D5BD',
    deviceId: 'B86488CD-ECD5-435A-8482-FF9D3C8978DD',
  },
  deviceCount: ['device1', 'device2'],
  disconnectError: false,
  delayMillis: 0
};
