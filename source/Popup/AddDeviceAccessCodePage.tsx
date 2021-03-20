import * as React from 'react';

import {
  AppBar,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  IconButton,
  Slide,
  Toolbar,
  Typography
} from '@material-ui/core';
import { ArrowBackOutlined, RefreshOutlined, VpnKeyOutlined } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';

import {
  cacheNutStyles,
  CancelActivationButton,
  formatCode,
  navigateTo,
  slideDirection,
  SlideDirection,
  Toast,
  ToastComponent
} from './PageSupport';
import { AddDeviceLinkCodePage } from './AddDeviceLinkCodePage';
import { computeKeyPayloadHash, createKeyPair, createKeyPayload, createSalt } from '../CacheNut/Crypto';
import { requestAccessCode } from '../CacheNut/HttpClient';
import { ActivationData, loadActivationData, saveActivationData } from '../CacheNut/Model';
import { AccountPage } from './AccountPage';

function createAddDeviceAccessCodeController(): AddDeviceAccessCodeController {
  return {
    fetchAccessCode: async (): Promise<string> =>
      loadActivationData().then((data) => {
        if (data) {
          return data.accessCode;
        }
        return createKeyPair().then(async (keyPair) => {
          const publicKeyPayload = await createKeyPayload(
            keyPair.publicKey,
            createSalt(22)
          );
          const accessCode = await requestAccessCode(publicKeyPayload);
          const activation: ActivationData = {
            step: 'AccessCode',
            accessCode,
            privateKey: keyPair.privateKey,
            firstHash: await computeKeyPayloadHash(publicKeyPayload),
          };

          if (await saveActivationData(activation)) {
            return accessCode;
          }
          return '!';
        });
      }),
  };
}

export const AddDeviceAccessCodePage: React.FC<{slide?: SlideDirection; mock?: AddDeviceAccessCodeController;}> =
  ({ mock, slide }) =>
{
  const classes = cacheNutStyles();
  const [accessCode, setAccessCode] = React.useState('');
  const controller = mock || createAddDeviceAccessCodeController();
  const toast: Toast = {} as Toast;

  React.useEffect(() => {
    if (!accessCode) {
      controller.fetchAccessCode()
      .then((code) => {
        if (code) {
          setAccessCode(code);
        }
      })
      .catch(() => {
        setAccessCode('!');
      });
    }
  });

  let accessCodeBody: JSX.Element;
  if (!accessCode) {
    accessCodeBody = (
      <>
        Requesting access code...
        <CircularProgress />
      </>
    );
  } else if (accessCode !== '!') {
    accessCodeBody = (
      <>
        Enter the access code below on the new device
        <Typography gutterBottom>{formatCode(accessCode, ' - ')}</Typography>
        <Button
          variant="contained"
          color="primary"
          className={classes.submit}
          onClick={(): void => navigateTo(<AddDeviceLinkCodePage slide="next" />)}
        >
          Next
        </Button>
        <Button
          variant="outlined"
          className={classes.submit}
          size="small"
          startIcon={<RefreshOutlined />}
          aria-label="Get new code"
          onClick={(): void => setAccessCode('')}
        >
          New access code
        </Button>
      </>
    );
  } else {
    accessCodeBody = (
      <>
        <Alert severity="error">
          There was a problem obtaining an access code.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          className={classes.submit}
          onClick={(): void => setAccessCode('')}
        >
          Try again
        </Button>
      </>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={(): void => navigateTo(<AccountPage />)}
          >
            <ArrowBackOutlined />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.title}>
            Access Code
          </Typography>
          <CancelActivationButton
            message="Cancel adding device?"
            toast={toast}
          />
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container className={classes.paper}>
          <VpnKeyOutlined fontSize="large" />
          {accessCodeBody}
        </Container>
      </Slide>
      {ToastComponent(toast)}
    </>
  );
};

export interface AddDeviceAccessCodeController {
  fetchAccessCode: () => Promise<string>;
}
