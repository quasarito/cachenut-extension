import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import { Options, OptionsController } from '../Options/Options';

export default {
  title: 'Example/OptionsPage',
  component: Options,
} as Meta;

const Template: StoryFn = ({appVersion}) => {
  const mock: OptionsController = {
    getAppVersion: async () => {
      return appVersion;
    }    
  };
  return <Options mock={mock} />;
};

export const Page = Template.bind({});

Page.args = {
  appVersion: `storybook-v1`,
};
