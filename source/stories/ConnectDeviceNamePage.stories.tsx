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

const Template: StoryFn = ({accountId, error}) => {
  const mock: ConnectDeviceNameController = {
    registerAsDevice: async (name) => {
      console.log(`registerAsDevice: ${name}`);
      if (error) {
        return Promise.resolve([null, error]);
      }
      const account: CacheNutAccount = {
        id: accountId,
        deviceId: 'test-device',
        token: 'test-token',
      };
      return Promise.resolve([account, null]);
    },
  };
  return <ConnectDeviceNamePage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  accountId: 'FFA29C89-7A79-4C78-94D9-2CC0E9CA5A03',
  error: '',
};
