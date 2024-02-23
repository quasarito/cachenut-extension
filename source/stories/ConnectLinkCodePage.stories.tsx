import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {
  ConnectLinkCodeController,
  ConnectLinkCodePage,
} from '../Popup/ConnectLinkCodePage';

export default {
  title: 'Example/ConnectLinkCodePage',
  component: ConnectLinkCodePage,
} as Meta;

const Template: StoryFn = ({linkCode, delayMillis, error}) => {
  const mock: ConnectLinkCodeController = {
    computeLinkCode: async () => new Promise(resolve => setTimeout(() => resolve(error ? '' : linkCode), delayMillis))
  };
  return <ConnectLinkCodePage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  linkCode: 'FFA29C897A794C7894D9',
  delayMillis: 0,
  error: false
};
