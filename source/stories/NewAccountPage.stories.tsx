import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';
import {
  NewAccountPage,
  NewAccountPageController,
} from '../Popup/NewAccountPage';
import {CacheNutAccount} from '../CacheNut/Model';

export default {
  title: 'Example/NewAccountPage',
  component: NewAccountPage,
} as Meta;

const Template: StoryFn = ({accountId, delayMillis, error}) => {
  const mock: NewAccountPageController = {
    createAccount: async (name) => {
      console.log(`createAccount: ${name}`);
      if (error) {
        return new Promise(resolve => { setTimeout(() => resolve([null, error]), delayMillis || 0); });
      }
      const account: CacheNutAccount = {
        id: accountId,
        deviceId: 'test-device',
        token: 'test-token',
      };
      return new Promise(resolve => { setTimeout(() => resolve([account, null]), delayMillis || 0); });
    },
  };
  return <NewAccountPage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  accountId: 'FFA29C89-7A79-4C78-94D9-2CC0E9CA5A03',
  delayMillis: 0,
  error: '',
};
