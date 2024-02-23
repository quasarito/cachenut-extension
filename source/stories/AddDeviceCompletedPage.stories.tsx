import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import {AddDeviceCompletedPage} from '../Popup/AddDeviceCompletedPage';

export default {
  title: 'Example/AddDeviceCompletedPage',
  component: AddDeviceCompletedPage,
} as Meta;

const Template: StoryFn = () => <AddDeviceCompletedPage />;

export const Page = Template.bind({});
Page.args = {};
