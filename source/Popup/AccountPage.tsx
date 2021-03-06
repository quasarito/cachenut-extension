import * as React from 'react';

import { AppBar, Button, Container, CssBaseline, IconButton, Slide, Toolbar, Typography } from '@material-ui/core';
import { AccountBoxOutlined, ArrowBackOutlined, HowToRegOutlined } from '@material-ui/icons';
import { browser } from 'webextension-polyfill-ts';

import { cacheNutStyles, navigateTo, slideDirection, SlideDirection, Toast, ToastComponent } from './PageSupport';
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
      browser.runtime.sendMessage({event: 'unlinked'});
    })
  };
}

function addNewDeviceClicked(): void {
  navigateTo(<AddDeviceAccessCodePage />);
}

export const AccountPage: React.FC<{slide?: SlideDirection; mock?: AccountPageController;}> = ({mock, slide}) => {
  const classes = cacheNutStyles();
  const [ account, setAccount ] = React.useState({} as CacheNutAccount);
  const [ deviceList, setDeviceList ] = React.useState([] as Device[]);
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

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={(): void => navigateTo(<HistoryPage slide="back" />)}
          >
            <ArrowBackOutlined />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.title}>
            Account Info
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container className={classes.paper}>
          {account.id ? (<HowToRegOutlined fontSize="large" />) : (<AccountBoxOutlined fontSize="large" />)}
          Account id:
          <Typography gutterBottom>
            {account.id ? account.id : 'No active account'}
          </Typography>
          Device id:
          <Typography gutterBottom>
            {account.id ? account.deviceId : 'No active device'}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            className={classes.submit}
            onClick={(): void => {
              controller
                .disconnect()
                .then(async () => toast.message('Disconnected.'))
                .then(() => navigateTo(<UnregisteredPage />))
                .catch(async () =>
                  toast.error('An error occurred. Try again.')
                );
            }}
          >
            Disconnect from account
          </Button>
          Connected:
          <Typography gutterBottom>
            {deviceList.length||'#'} {deviceList.length === 1 ? 'device' : 'devices'}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            className={classes.submit}
            onClick={(): void => navigateTo(<ManageDevicesPage slide="next" />)}
          >
            Manage devices
          </Button>
          <Button
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={addNewDeviceClicked}
          >
            Add a new device
          </Button>
        </Container>
      </Slide>
      {ToastComponent(toast)}
    </>
  );
};

export interface AccountPageController {
  getAccount: () => Promise<CacheNutAccount>;
  getDeviceList: () => Promise<Device[]>;
  disconnect: () => Promise<void>;
}
