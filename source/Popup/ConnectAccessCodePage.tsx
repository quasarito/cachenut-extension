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
import { ArrowBackOutlined, VpnKeyOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  navigateTo,
  PageError,
  slideDirection,
  SlideDirection,
  stripNonAlphanumeric,
  Toast,
  ToastComponent,
  validatingTextField,
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
    connectClicked: async (accessCode: string): Promise<boolean> => {
      const c = crypto.subtle;

      try {
        accessCode = stripNonAlphanumeric(accessCode.trim().toUpperCase());
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
      catch (err: any) {
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
  const accessCode = validatingTextField(true);
  const toast: Toast = {} as Toast;
  const controller = mock || createConnectAccessCodeController();

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="back"
          onClick={(): void => navigateTo(<UnregisteredPage slide="done" />)}
          size="large">
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Connect Account
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        <VpnKeyOutlined fontSize="large" />
        Enter the access code displayed on the active device.
        <TextField fullWidth
          label="Access code"
          {...accessCode.textFieldProps}
        />
        <Button
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          disabled={accessCode.disableInput}
          onClick={(): void => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const accessCodeValue = accessCode?.value as any;
            if (!accessCodeValue || !accessCodeValue.trim()) {
              toast.error('Please provide an access code.');
              return;
            }
            controller.connectClicked(accessCodeValue)
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
  </>;
};

export interface ConnectAccessCodeController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connectClicked: (accessCodeField: any) => Promise<boolean>;
}
