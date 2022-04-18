import * as React from 'react';

import {
  AppBar,
  Container,
  CssBaseline,
  IconButton,
  Slide,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { ArrowBackOutlined, PostAddOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  createDeviceName,
  navigateTo,
  sendMessage,
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
            await sendMessage({event: 'linked'});
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
  const deviceNameField = React.useRef();
  const toast: Toast = {} as Toast;
  const controller = mock || createNewAccountPageController();
  const defaultName = createDeviceName();
  const [ registering, setRegistering ] = React.useState(false);

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={(): void => navigateTo(<UnregisteredPage slide="done" />)}
          size="large">
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          New Account
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        <PostAddOutlined fontSize="large" />
        Create a new account for this device.
        <TextField fullWidth label="Device name" defaultValue={defaultName} inputRef={deviceNameField} />
        <LoadingButton
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          loading={registering}
          onClick={() => {
            setRegistering(true);
            controller.createAccount(deviceNameField.current)
            .then(([account, err]) => {
              if (account) {
                toast.success('Account created.').then(() => {
                  navigateTo(<AccountPage slide="done" />);
                });
              }
              else if (err) {
                toast.error(err);
                setRegistering(false);
              }
            })
            .catch(() => {
              toast.error('Unable to save account. Try again.');
              setRegistering(false);
            })
          }}
        >
          Register
        </LoadingButton>
      </Container>
    </Slide>
    {ToastComponent(toast)}
  </>;
};

export interface NewAccountPageController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAccount: (input: any) => Promise<[CacheNutAccount, null] | [null, string]>;
}
