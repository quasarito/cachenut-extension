import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {
  AddDeviceAccessCodeController,
  AddDeviceAccessCodePage,
} from '../Popup/AddDeviceAccessCodePage';

export default {
  title: 'Example/AddDeviceAccessCodePage',
  component: AddDeviceAccessCodePage,
} as Meta;

const Template: StoryFn = ({accessCode, delayMs, error}) => {
  const mock: AddDeviceAccessCodeController = {
    fetchAccessCode: async () =>
      new Promise((resolve, reject) =>
        setTimeout(() => (error ? reject(error) : resolve(accessCode)), delayMs)
      ),
  };
  return <AddDeviceAccessCodePage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  accessCode: 'ACSCDE',
  delayMs: 1500,
  error: '',
};
