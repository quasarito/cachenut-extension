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
  Container,
  CssBaseline,
  Divider,
  IconButton,
  SxProps,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { ExpandMoreOutlined } from '@mui/icons-material';
import * as React from 'react';
import { parseCryptoKey } from '../CacheNut/Crypto';
import { createHttpClient, register } from '../CacheNut/HttpClient';
import { resetAccount, saveAccount, saveCryptoKey, storeSettings } from '../CacheNut/Model';
// import {Logger} from '../CacheNut/Support';
import { CacheNutStyles, createDeviceName, sendMessage, Toast, ToastComponent } from '../Popup/PageSupport';

// const logger = Logger('OptionsIndex');

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

export const Options: React.FC = () => {
  const toast: Toast = {} as Toast;

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

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <Typography variant="h6" color="inherit">
          Cache Nut Advanced Options
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Divider />
    <Container sx={ OptionsStyles.paper }>
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
      <Card variant="outlined">
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
      </Card>
    </Container>
    {ToastComponent(toast)}
  </>;
};
