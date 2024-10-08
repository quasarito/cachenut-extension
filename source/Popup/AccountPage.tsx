import * as React from 'react';

import {
  AppBar,
  Button,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Slide,
  Toolbar,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { AccountBoxOutlined, ArrowBackOutlined, HowToRegOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  navigateTo,
  sendMessage,
  slideDirection,
  SlideDirection,
  Toast,
  ToastComponent
} from './PageSupport';
import { HistoryPage } from './HistoryPage';
import { UnregisteredPage } from './UnregisteredPage';
import { resetAccount, loadAccount, Device, CacheNutAccount } from '../CacheNut/Model';
import { AddDeviceAccessCodePage} from './AddDeviceAccessCodePage';
import { createHttpClient } from '../CacheNut/HttpClient';
import { ManageDevicesPage } from './ManageDevicesPage';

function createAccountPageController(): AccountPageController {
  return {
    getAccount: async (): Promise<CacheNutAccount> => loadAccount(),
    getDeviceList: async (): Promise<Device[]> => createHttpClient().then(async (client) => client.loadDeviceList()),
    disconnect: async (): Promise<void> => resetAccount().then(() => { // remove account info from local storage
      sendMessage({event: 'unlinked'});
    })
  };
}

function addNewDeviceClicked(): void {
  navigateTo(<AddDeviceAccessCodePage />);
}

export const AccountPage: React.FC<{slide?: SlideDirection; mock?: AccountPageController;}> = ({mock, slide}) => {
  const [ account, setAccount ] = React.useState({} as CacheNutAccount);
  const [ deviceList, setDeviceList ] = React.useState([] as Device[]);
  const [ disconnecting, setDisconnecting ] = React.useState(0); // 0=connected, 1=disconnecting, -1=disconnected
  const toast: Toast = {} as Toast;
  const controller = mock || createAccountPageController();

  React.useEffect(() => {
    if (!account.id) {
      controller.getAccount().then((acct) => {
        if (acct.id) {
          setAccount(acct);
        }
      });
    }
  });
  React.useEffect(() => {
    if (deviceList.length === 0) {
      controller.getDeviceList().then((devices) => setDeviceList(devices));
    }
  });

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="back"
          disabled={disconnecting !== 0}
          onClick={(): void => navigateTo(<HistoryPage slide="back" />)}
          size="large">
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Account Info
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        {account.id ? (<HowToRegOutlined fontSize="large" />) : (<AccountBoxOutlined fontSize="large" />)}
        Connected:
        <Typography id="device_count" gutterBottom>
          {deviceList.length||'#'} {deviceList.length === 1 ? 'device' : 'devices'}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          sx={ CacheNutStyles.submit }
          disabled={disconnecting !== 0}
          onClick={(): void => navigateTo(<ManageDevicesPage slide="next" />)}
        >
          Manage devices
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          disabled={disconnecting !== 0}
          onClick={addNewDeviceClicked}
        >
          Add a new device
        </Button>
        <LoadingButton
          variant="outlined"
          color="primary"
          sx={ CacheNutStyles.submit }
          loading={disconnecting === 1}
          disabled={disconnecting !== 0}
          onClick={(): void => {
            setDisconnecting(1);
            controller
              .disconnect()
              .then(() => setDisconnecting(-1))
              .then(async () => toast.message('Disconnected.'))
              .then(() => navigateTo(<UnregisteredPage />))
              .catch(async () => {
                await toast.error('An error occurred. Try again.');
                setDisconnecting(0);
              });
          }}
        >
          Disconnect from account
        </LoadingButton>
        <Divider>Account id:</Divider>
        <Typography id="account_id" gutterBottom>
          {account.id ? account.id : 'No active account'}
        </Typography>
        <Divider>Device id:</Divider>
        <Typography id="device_id" gutterBottom>
          {account.id ? account.deviceId : 'No active device'}
        </Typography>
      </Container>
    </Slide>
    {ToastComponent(toast)}
  </>;
};

export interface AccountPageController {
  getAccount: () => Promise<CacheNutAccount>;
  getDeviceList: () => Promise<Device[]>;
  disconnect: () => Promise<void>;
}
