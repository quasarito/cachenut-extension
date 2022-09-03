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
} from '@mui/material';
import { ArrowBackOutlined, DoneOutlineOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  CancelActivationButton,
  createDeviceName,
  navigateTo,
  sendMessage,
  slideDirection,
  SlideDirection,
  Toast,
  ToastComponent,
} from './PageSupport';
import { AccountPage } from './AccountPage';
import { getAccountAuth, register } from '../CacheNut/HttpClient';
import {
  CacheNutAccount,
  loadActivationData,
  resetActivationData,
  saveAccount,
  saveCryptoKey,
} from '../CacheNut/Model';
import { ConnectLinkCodePage } from './ConnectLinkCodePage';

function createConnectDeviceNameController(): ConnectDeviceNameController {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerAsDevice: async (deviceNameField: any): Promise<[CacheNutAccount, null] | [null, string]> => {
      const deviceName = deviceNameField.value;
      const c = crypto.subtle;
      const activation = await loadActivationData();
      if (activation?.sharedKey) {
        try {
          const accountAuth = await getAccountAuth(activation.accessCode, activation.sharedKey);
          await saveCryptoKey(await c.importKey('jwk', accountAuth.key, 'AES-GCM', true, [ 'encrypt', 'decrypt' ]));
          const account = await register(deviceName, accountAuth.accountId);
          if (await saveAccount(account)) {
            return [ account, null ];
          }
          return [ null, 'Unable to save account.' ];
        }
        catch (err) {
          console.error('registerAsDevice:', err);
          throw err;
        }
      }
      else {
        return [null, 'No activation key found.'];
      }
    },
  };
}

export const ConnectDeviceNamePage: React.FC<{slide?: SlideDirection;mock?: ConnectDeviceNameController;}> =
  ({mock, slide}) =>
{
  const deviceNameField = React.useRef();
  const toast: Toast = {} as Toast;
  const defaultName = createDeviceName();
  const controller = mock || createConnectDeviceNameController();

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={(): void =>navigateTo(<ConnectLinkCodePage slide="back" />)}
          size="large">
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Finish
        </Typography>
        <CancelActivationButton message="Quit account connection?" toast={toast}
        />
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        <DoneOutlineOutlined fontSize="large" />
        Almost done.
        <TextField
          fullWidth
          label="Name to identify this device"
          defaultValue={defaultName}
          inputRef={deviceNameField}
        />
        <Button
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          onClick={(): void => {
            controller.registerAsDevice(deviceNameField.current)
            .then(([account, err]) => {
              if (account) {
                resetActivationData();
                toast.success('Connected.')
                .then(() => sendMessage({event: 'linked'}))
                .then(() => navigateTo(<AccountPage />));
              }
              else if (err) {
                toast.error(err);
              }
            })
            .catch((err) => {
              toast.error(err.message || 'An error occurred. Try again.');
            });
          }}
        >
          Done
        </Button>
      </Container>
    </Slide>
    {ToastComponent(toast)}
  </>;
};

export interface ConnectDeviceNameController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerAsDevice: (input: any) => Promise<[CacheNutAccount, null] | [null, string]>;
}
