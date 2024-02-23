import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import { CopyContentPage, CopyContentController } from '../Popup/CopyContentPage';

export default {
  title: 'Example/CopyContentPage',
  component: CopyContentPage,
} as Meta;

const Template: StoryFn = ({error, delayMillis}) => {
  const mock: CopyContentController = {
    copy: async () => new Promise(resolve => setTimeout(() => resolve(!error), delayMillis))
  };

  return <CopyContentPage mock={mock} />;
};

export const Page = Template.bind({});
Page.args = {
  error: false,
  delayMillis: 0
};
