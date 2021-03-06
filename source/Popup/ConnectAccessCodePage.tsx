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
import { ArrowBackOutlined, VpnKeyOutlined } from '@material-ui/icons';

import {
  cacheNutStyles,
  navigateTo,
  PageError,
  slideDirection,
  SlideDirection,
  stripNonAlphanumeric,
  Toast,
  ToastComponent,
} from './PageSupport';
import { UnregisteredPage } from './UnregisteredPage';
import { ConnectLinkCodePage } from './ConnectLinkCodePage';
import {
  computeKeyPayloadHash,
  createKeyPair,
  createKeyPayload,
  createSalt,
  createSharedKey,
} from '../CacheNut/Crypto';
import { exchangeLinkKey } from '../CacheNut/HttpClient';
import { ActivationData, saveActivationData } from '../CacheNut/Model';
import { Logger } from '../CacheNut/Support';

const logger = Logger('ConnectAccessCodePage');

function createConnectAccessCodeController(): ConnectAccessCodeController {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectClicked: async (accessCodeField: any): Promise<boolean> => {
      const c = crypto.subtle;

      try {
        const accessCode = stripNonAlphanumeric(accessCodeField.value.trim().toUpperCase());
        logger.log(`accessCode=${accessCode}`);
        // Generate an EC key pair to create a shared key
        const keyPair = await createKeyPair();
        // Exchange the public keys
        const publicKeyPayload = await createKeyPayload(keyPair.publicKey, createSalt(22));
        const otherPublicKeyPayload = await exchangeLinkKey(accessCode, publicKeyPayload);
        const otherPublicJwk = otherPublicKeyPayload.key;
        const otherPayloadHash = await computeKeyPayloadHash(otherPublicKeyPayload);
        // Derive the shared key with the generated private key, and the other public key
        const otherPublicCryptoKey = await c.importKey(
          'jwk',
          otherPublicJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        );
        const sharedKey = await createSharedKey(keyPair.privateKey, otherPublicCryptoKey);
        // Store the key
        const data: ActivationData = {
          step: 'LinkCode',
          accessCode,
          privateKey: keyPair.privateKey,
          publicKey: otherPublicCryptoKey,
          sharedKey,
          firstHash: otherPayloadHash,
          secondHash: await computeKeyPayloadHash(publicKeyPayload),
        };
        return await saveActivationData(data);
      }
      catch (err) {
        if (err.status === 404) {
          throw new PageError('Incorrect access code.', err);
        }
        else {
          throw err;
        }
      }
    },
  };
}

export const ConnectAccessCodePage: React.FC<{slide?: SlideDirection;mock?: ConnectAccessCodeController;}> =
  ({mock, slide}) =>
{
  const classes = cacheNutStyles();
  const accessCodeField = React.useRef();
  const toast: Toast = {} as Toast;
  const controller = mock || createConnectAccessCodeController();

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
            Connect Account
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container className={classes.paper}>
          <VpnKeyOutlined fontSize="large" />
          Enter the access code displayed on the active device.
          <TextField fullWidth label="Access code" inputRef={accessCodeField} />
          <Button
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={(): void => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const accessCodeInput = accessCodeField.current as any;
              if (!accessCodeInput || !accessCodeInput.value.trim()) {
                toast.error('Please provide an access code.');
                return;
              }
              controller.connectClicked(accessCodeField.current)
              .then((payloadHash) => {
                if (payloadHash) {
                  navigateTo(<ConnectLinkCodePage slide="next" />);
                }
                else {
                  toast.error('An error occurred. Try again.');
                }
              })
              .catch((error) => {
                console.log(error.thrown || error);
                toast.error(error.message || 'An error occurred. Try again.');
              });
            }}
          >
            Connect
          </Button>
        </Container>
      </Slide>
      {ToastComponent(toast)}
    </>
  );
};

export interface ConnectAccessCodeController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connectClicked: (accessCodeField: any) => Promise<boolean>;
}
