import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {UnregisteredPage} from '../Popup/UnregisteredPage';

export default {
  title: 'Example/UnregisteredPage',
  component: UnregisteredPage,
} as Meta;

const Template: StoryFn = () => <UnregisteredPage />;

export const Page = Template.bind({});
Page.args = {};
