import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {
  ConnectAccessCodeController,
  ConnectAccessCodePage,
} from '../Popup/ConnectAccessCodePage';

export default {
  title: 'Example/ConnectAccessCodePage',
  component: ConnectAccessCodePage,
} as Meta;

const Template: StoryFn = ({error}) => {
  const mock: ConnectAccessCodeController = {
    connectClicked: async (name) => {
      console.log(`connectClicked: ${name}`);
      return Promise.resolve(!error);
    }
  };

  return <ConnectAccessCodePage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  error: false,
};
