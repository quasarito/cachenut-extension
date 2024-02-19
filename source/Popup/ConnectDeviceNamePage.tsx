import * as React from 'react';

import {
  AppBar,
  Button,
  Container,
  CssBaseline,
  Slide,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { DoneOutlineOutlined } from '@mui/icons-material';

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
  validatingTextField,
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

function createConnectDeviceNameController(): ConnectDeviceNameController {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerAsDevice: async (deviceName: string): Promise<[CacheNutAccount, null] | [null, string]> => {
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
  const deviceName = validatingTextField(true, createDeviceName());
  const [ done, setDone ] = React.useState(false);
  const toast: Toast = {} as Toast;
  const controller = mock || createConnectDeviceNameController();

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Finish
        </Typography>
        <CancelActivationButton message="Quit account connection?" toast={toast} />
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
          {...deviceName.textFieldProps}
        />
        <Button
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          disabled={done || deviceName.disableInput}
          onClick={(): void => {
            setDone(true);
            controller.registerAsDevice(deviceName.value)
            .then(([account, err]) => {
              if (account) {
                resetActivationData();
                toast.success('Connected.')
                .then(() => sendMessage({event: 'linked'}))
                .then(() => navigateTo(<AccountPage />));
              }
              else if (err) {
                setDone(false);
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
