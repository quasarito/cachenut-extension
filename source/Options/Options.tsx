/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Alert,
  AppBar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  CssBaseline,
  Divider,
  IconButton,
  Stack,
  SxProps,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { CloseOutlined, ExpandMoreOutlined } from '@mui/icons-material';
import * as React from 'react';

import { CacheNutStyles, createDeviceName, navigateTo, sendMessage, Toast, ToastComponent } from '../Popup/PageSupport';
import { Config } from '../CacheNut/Config';
import { createHttpClient, register } from '../CacheNut/HttpClient';
import { HistoryPage } from '../Popup/HistoryPage';
import { parseCryptoKey } from '../CacheNut/Crypto';
import { resetAccount, saveAccount, saveCryptoKey, storeSettings } from '../CacheNut/Model';

declare var APP_VERSION: string;
declare var BUILT_AT: string;
declare var IS_EXTENSION_BUILD: boolean;

const OptionsStyles = {
  paper: {
    my: 1,
    display: 'flex',
    flexDirection: 'column',
  } as SxProps,
  card: {
    py: 0
  } as SxProps,
  submit: {
    mx: 0,
    my: 1
  } as SxProps,
  menuButton: {
    mr: 2,
  } as SxProps
};

function createOptionsController(): OptionsController {
  return {
    getAppVersion: async () => {
      if (IS_EXTENSION_BUILD) {
        const browser = await import('webextension-polyfill');
        return browser.runtime.getManifest().version + ':' + BUILT_AT;
      }
      else {
        return APP_VERSION + ':' + BUILT_AT;
      }
    }    
  }
}

export const Options: React.FC<{mock?: OptionsController;}> = ({mock}) => {
  const toast: Toast = {} as Toast;
  const controller = mock || createOptionsController();

  const [ buildVersion, setBuildVersion ] = React.useState('' + BUILT_AT);
  React.useEffect(() => {
    (async () => {
        setBuildVersion(await controller.getAppVersion());
    })();
  });

  const resetData = (): void => {
    toast.prompt('Erase all account data?', ['Confirm', 'Cancel'])
    .then((answer) => {
      if (answer === 'Confirm') {
        resetAccount() // remove account info from local storage
        .then(() => {
          sendMessage({event: 'unlinked'});
        });
      }
    });
  };

  const syncAccount = (): void => {
    createHttpClient()
    .then(async (client) => client.syncDeviceInfo())
    .then(async (device) => storeSettings({accountDeviceId: device.deviceId}))
    .then(async () => toast.success('Synced.'));
  };

  const [ refreshCount, refresh ] = React.useState(0);
  const refreshOnChange = (length: number) => (event: any): void => {
    if (!length && length !== 0) {
      return; // first render, don't check until register button clicked
    }
    if (event.target.value.length !== length && (event.target.value.length === 0 || length === 0)) {
      // went from empty->non-empty or non-empty->empty, so re-render so error prop is re-evaluated
      refresh(refreshCount + 1);
    }
  };

  const accountIdField = React.useRef<any>();
  const accountKeyField = React.useRef<any>();
  const deviceNameField = React.useRef<any>();
  const registerDirect = (): void => {
    const deviceName = deviceNameField.current?.value;
    const accountId = accountIdField.current?.value;
    const accountKey = accountKeyField.current?.value;

    if (!deviceName || !accountId || !accountKey) {
      const missingFields = [
        accountId && accountId.trim() ? '' : 'Account id',
        accountKey && accountKey.trim() ? '' : 'Account key',
        deviceName && deviceName.trim() ? '' : 'Device name',
      ];
      toast.error(`Missing values for registration: ${missingFields.filter((f) => f).join(', ')}`);
    }
    else {
      resetAccount() // remove account info from local storage
      .then(() => sendMessage({event: 'unlinked'}))
      .then(async () => saveCryptoKey(await parseCryptoKey(accountKey)))
      .then((savedKey) => {
        if (savedKey) {
          register(deviceName, accountId)
          .then(async (account) => saveAccount(account))
          .then((savedAccount) => {
            if (savedAccount) {
              sendMessage({event: 'linked'});
              toast.success('Registered.');
            } else {
              toast.error('Unable to save account key.');
            }
          })
          .catch((err) => {
            console.error('Account save error', err);
            toast.error('Unable to save account key.');
          });
        }
        else {
          toast.error('Account key error.');
        }
      })
      .catch((err) => {
        console.error('Account key save error', err);
        toast.error('Unable to save account key.');
      });
    }
  };

  const [ expanded, setExpanded ] = React.useState(false);
  const handleExpandClick = (): void => { setExpanded(!expanded); };
  const directRegister = IS_EXTENSION_BUILD
    ?
    (<Card variant="outlined">
      <CardHeader
        action={
          <IconButton
            onClick={handleExpandClick}
            sx={expanded ? CacheNutStyles.expandClose : CacheNutStyles.expandOpen }
            size="large">
            <ExpandMoreOutlined />
          </IconButton>
        }
        title="Direct Registration"
        subheader="Add an account with known details."
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={ OptionsStyles.card }>
          <Alert severity="warning">
            For advanced use only! Current account details will be lost.
          </Alert>
          <div>
            <TextField
              variant="outlined"
              label="Account id"
              sx={ OptionsStyles.paper }
              required
              inputRef={accountIdField}
              onChange={refreshOnChange(accountIdField.current?.value.length)}
              error={accountIdField.current?.value.trim().length === 0}
            />
          </div>
          <div>
            <TextField
              variant="outlined"
              label="Account key"
              multiline
              sx={ OptionsStyles.paper }
              required
              rows={3}
              maxRows={10}
              inputRef={accountKeyField}
              onChange={refreshOnChange(accountKeyField.current?.value.length)}
              error={accountKeyField.current?.value.trim().length === 0}
            />
          </div>
          <div>
            <TextField
              variant="outlined"
              label="Device name"
              sx={ OptionsStyles.paper }
              required
              defaultValue={createDeviceName()}
              inputRef={deviceNameField}
              onChange={refreshOnChange(deviceNameField.current?.value.length)}
              error={deviceNameField.current?.value.trim().length === 0}
            />
          </div>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={ OptionsStyles.submit }
            onClick={registerDirect}
          >
            Register
          </Button>
        </CardActions>
      </Collapse>
    </Card>)
    : (<></>);

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <Typography variant="h6" color="inherit">
          Cache Nut Advanced Options
        </Typography>
        {IS_EXTENSION_BUILD || <IconButton
          edge="end"
          color="inherit"
          aria-label="Close"
          onClick={(): void => {
            if (!IS_EXTENSION_BUILD) {
              navigateTo(<HistoryPage slide="done"/>);
            }
          }}
          size="large">
          <CloseOutlined />
        </IconButton>}
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Divider />
    <Stack sx={{...OptionsStyles.paper, padding: '0 16px'}} spacing={1/2}>
      <Card variant="outlined">
        <CardHeader
          title="Sync account data"
          subheader="Refresh account information for this browser."
        />
        <CardActions>
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={ OptionsStyles.submit }
            onClick={syncAccount}
          >
            Sync
          </Button>
        </CardActions>
      </Card>
      <Card variant="outlined">
        <CardHeader
          title="Erase account data"
          subheader="Remove all account information from this browser."
        />
        <CardActions>
          <Button
            size="small"
            variant="contained"
            color="primary"
            sx={ OptionsStyles.submit }
            onClick={resetData}
          >
            Reset
          </Button>
        </CardActions>
      </Card>
      {directRegister}
      <Typography variant="caption" display="block" gutterBottom>
        Endpoint: { Config.baseUrl }
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        Build: { buildVersion }
      </Typography>
      {Config.loggingEnabled && <Typography variant="caption" display="block" gutterBottom>Logging enabled</Typography>}
    </Stack>
    {ToastComponent(toast)}
  </>;
};

export interface OptionsController {
  getAppVersion: () => Promise<string>;
}