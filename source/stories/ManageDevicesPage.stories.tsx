import React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import {Meta, StoryFn} from '@storybook/react';

import { ManageDevicesController, ManageDevicesPage } from '../Popup/ManageDevicesPage';
import { CacheNutAccount, Device } from '../CacheNut/Model';

export default {
  title: 'Example/ManageDevicesPage',
  component: ManageDevicesPage,
} as Meta;

const Template: StoryFn = ({canRemove, canModify, devicesCreatedAgoDays}) => {
  const mock: ManageDevicesController = {
    getAccount: async (): Promise<CacheNutAccount> => {
      return accountItem();
    },
    loadDeviceList: async (): Promise<Device[]> => {
      return devicesCreatedAgoDays.map((agoDays, idx) => {
        return deviceItem(
          `Device #${idx}`,
          idx === 0 ? THIS_DEVICE_ID : `${Date.now()}-${idx}`,
          agoDays,
          idx === 0 ? true : Math.random() < 0.50
        );
      });
    },
    removeDevice: async (deviceId: string): Promise<boolean> => {
      return deviceId === THIS_DEVICE_ID ? false : canRemove;
    },
    updateDevice: async (deviceId: string, isTrusted: boolean): Promise<boolean> => {
      return deviceId === THIS_DEVICE_ID ? false : canModify;
    }
  };
  return <ManageDevicesPage mock={mock} />;
};

export const Page = Template.bind({});

const THIS_DEVICE_ID = "8d043f36-4ecf-48aa-956d-5ff611da0db8";
const THIS_ACCOUNT_ID = "268B6611-FF1B-4658-90AD-DA4FCF8AF456";

function accountItem() {
  return {
    deviceId: THIS_DEVICE_ID,
    id: THIS_ACCOUNT_ID,
    token: "37819615-1EE8-41F0-91B2-6B6794722F2D"
  };
}

function deviceItem(name: string, deviceId: string, agoDays: number, manageDevice: boolean=false) {
  return {
    deviceId,
    name,
    createDate: createdAgo(agoDays*60*24),
    manageDevice
  };
}

function createdAgo(minutes: number) { return new Date(Date.now() - (minutes*60*1000)); }

Page.args = {
  devicesCreatedAgoDays: [10, 13, 7],
  canModify: true,
  canRemove: true,
};
