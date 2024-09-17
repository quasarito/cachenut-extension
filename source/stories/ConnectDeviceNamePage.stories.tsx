import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {
  ConnectDeviceNameController,
  ConnectDeviceNamePage,
} from '../Popup/ConnectDeviceNamePage';
import {CacheNutAccount} from '../CacheNut/Model';

export default {
  title: 'Example/ConnectDeviceNamePage',
  component: ConnectDeviceNamePage,
} as Meta;

const Template: StoryFn = ({accountId, error, delayMillis}) => {
  const mock: ConnectDeviceNameController = {
    registerAsDevice: async (name) => {
      console.log(`registerAsDevice: ${name}`);
      if (error) {
        return new Promise(resolve => setTimeout(() => resolve([null, error]), delayMillis || 0));
      }
      const account: CacheNutAccount = {
        id: accountId,
        deviceId: 'test-device',
        token: 'test-token',
      };
      return new Promise(resolve => setTimeout(() => resolve([account, null]), delayMillis || 0));
    },
  };
  return <ConnectDeviceNamePage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  accountId: 'FFA29C89-7A79-4C78-94D9-2CC0E9CA5A03',
  error: '',
  delayMillis: 0
};
