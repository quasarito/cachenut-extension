import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {
  AddDeviceLinkCodeController,
  AddDeviceLinkCodePage,
} from '../Popup/AddDeviceLinkCodePage';

export default {
  title: 'Example/AddDeviceLinkCodePage',
  component: AddDeviceLinkCodePage,
} as Meta;

const Template: StoryFn = ({linkCode, delayMillis, validated}) => {
  const mock: AddDeviceLinkCodeController = {
    computePartialLinkCode: async () => {
      if (linkCode) {
        return linkCode;
      }
      else {
        throw new Error('Link error: please cancel and try again.');
      }
    },
    validateLinkCode: async (code) => {
      console.log(`validateLinkCode: ${code}`);
      return new Promise(resolve => setTimeout(() => resolve(!!validated), delayMillis || 0));
    }
  };
  return <AddDeviceLinkCodePage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  linkCode: '4C7894D9',
  delayMillis: 0,
  validated: true,
};
