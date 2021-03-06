import * as React from 'react';

import {
  AppBar,
  Button,
  Container,
  CssBaseline,
  IconButton,
  Slide,
  TextField,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { ArrowBackOutlined, PostAddOutlined } from '@material-ui/icons';
import { browser } from 'webextension-polyfill-ts';

import {
  cacheNutStyles,
  createDeviceName,
  navigateTo,
  slideDirection,
  SlideDirection,
  Toast,
  ToastComponent,
} from './PageSupport';
import { register } from '../CacheNut/HttpClient';
import { AccountPage } from './AccountPage';
import { CacheNutAccount, saveAccount, saveCryptoKey } from '../CacheNut/Model';
import { UnregisteredPage } from './UnregisteredPage';
import { createCryptoKey } from '../CacheNut/Crypto';

function createNewAccountPageController(): NewAccountPageController {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createAccount: async (deviceNameInput: any): Promise<[CacheNutAccount, null] | [null, string]> => {
      const deviceName = deviceNameInput.value;
      return register(deviceName).then(async (account) => {
        if (await saveAccount(account)) {
          // generate the encryption key for the new account
          const cryptoKey = await createCryptoKey();
          if (await saveCryptoKey(cryptoKey)) {
            browser.runtime.sendMessage({event: 'linked'});
            return [account, null];
          }
          return [ null, 'Unable to create account key.' ];
        }
        return [ null, 'Unable to save account.' ];
      });
    },
  };
}

export const NewAccountPage: React.FC<{slide?: SlideDirection; mock?: NewAccountPageController;}> = ({mock, slide}) => {
  const classes = cacheNutStyles();
  const deviceNameField = React.useRef();
  const toast: Toast = {} as Toast;
  const controller = mock || createNewAccountPageController();
  const defaultName = createDeviceName();

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={(): void => navigateTo(<UnregisteredPage slide="done" />)}
          >
            <ArrowBackOutlined />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.title}>
            New Account
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container className={classes.paper}>
          <PostAddOutlined fontSize="large" />
          Create a new account for this device.
          <TextField fullWidth label="Device name" defaultValue={defaultName} inputRef={deviceNameField} />
          <Button
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={(): Promise<void> =>
              controller.createAccount(deviceNameField.current)
              .then(([account, err]) => {
                if (account) {
                  toast.success('Account created.').then(() => {
                    navigateTo(<AccountPage slide="done" />);
                  });
                }
                else if (err) {
                  toast.error(err);
                }
              })
              .catch(() => {
                toast.error('Unable to save account. Try again.');
              })
            }
          >
            Register
          </Button>
        </Container>
      </Slide>
      {ToastComponent(toast)}
    </>
  );
};

export interface NewAccountPageController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAccount: (input: any) => Promise<[CacheNutAccount, null] | [null, string]>;
}
