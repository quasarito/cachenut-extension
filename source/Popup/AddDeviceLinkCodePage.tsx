import * as React from 'react';

import { AppBar, Button, Container, CssBaseline, Slide, TextField, Toolbar, Typography } from '@mui/material';
import { LinkOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  CancelActivationButton,
  formatCode,
  linkCodeFromPayloadHash,
  navigateTo,
  PageError,
  slideDirection,
  SlideDirection,
  stripNonAlphanumeric,
  Toast,
  ToastComponent,
} from './PageSupport';
import { ActivationData, loadAccount, loadActivationData, loadCryptoKey, saveActivationData } from '../CacheNut/Model';
import { AccountAuth, fetchLinkKey, postAccountAuth } from '../CacheNut/HttpClient';
import { computeKeyPayloadHash, createSharedKey } from '../CacheNut/Crypto';
import { AddDeviceCompletedPage } from './AddDeviceCompletedPage';
import { Logger } from '../CacheNut/Support';

const logger = Logger('AddDeviceLinkCodePage:');

async function linkKey(activation: ActivationData): Promise<boolean> {
  const c = crypto.subtle;
  try {
    const payload = await fetchLinkKey(activation.accessCode);
    logger.log('linkKey.payload jwk=', payload.key, `salt=${payload.salt}, ts=${payload.ts}`);
    const payloadHash = await computeKeyPayloadHash(payload);
    logger.log(`linkKey.payload hash=${payloadHash}`);
    activation.publicKey = await c.importKey(
      'jwk',
      payload.key,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
    activation.secondHash = payloadHash;
    activation.sharedKey = await createSharedKey(activation.privateKey, activation.publicKey);
    activation.step = 'LinkCode';
    return await saveActivationData(activation);
  } catch (err) {
    console.log('linkKeyError', err);
    return false;
  }
}

function createAddDeviceLinkCodeController(): AddDeviceLinkCodeController {
  return {
    computeLinkCode: async (): Promise<string> => {
      const activation = await loadActivationData();
      if (activation?.firstHash) {
        setTimeout(async () => {
          await linkKey(activation);
        }, 0);
        return linkCodeFromPayloadHash(activation.firstHash);
      }
      return '!';
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validateLinkCode: async (linkCodeInput: any): Promise<boolean> => {
      const linkCode = linkCodeInput.value;
      if (!linkCode) {
        return false;
      }

      const activation = await loadActivationData();
      if (activation?.firstHash) {
        if (!activation.secondHash) {
          logger.log('No second hash. Re-requesting.');
          await linkKey(activation);
        }
        if (activation.secondHash && activation.sharedKey) {
          const fullLinkCode =
            linkCodeFromPayloadHash(activation.firstHash) +
            linkCodeFromPayloadHash(activation.secondHash);
          logger.log(`first=${activation.firstHash}, second=${activation.secondHash}`);
          logger.log(`entered=${linkCode}, linkCode=${fullLinkCode}`);
          const validated = stripNonAlphanumeric(linkCode.toUpperCase()) === fullLinkCode.toUpperCase();
          if (validated) {
            logger.log('code validated');
            const account = await loadAccount();
            const accountKey = await loadCryptoKey();
            if (account && accountKey) {
              const c = crypto.subtle;
              const accountAuth: AccountAuth = {
                accountId: account.id,
                key: await c.exportKey('jwk', accountKey),
              };
              try {
                logger.log('sending account auth');
                await postAccountAuth(activation.accessCode, accountAuth, activation.sharedKey);
                return true;
              }
              catch (err: any) {
                if (err.status === 404) {
                  throw new PageError('An error occurred. Please try again.', err);
                }
                throw err;
              }
            }
            logger.log('account=', account, 'accountKey=', accountKey);
          }
        }
      }
      return false;
    },
  };
}

export const AddDeviceLinkCodePage: React.FC<{slide?: SlideDirection; mock?: AddDeviceLinkCodeController;}> =
  ({mock, slide}) =>
{
  const linkCodeField = React.useRef();
  const [linkCode, setLinkCode] = React.useState('');
  const controller = mock || createAddDeviceLinkCodeController();
  const toast: Toast = {} as Toast;

  React.useEffect(() => {
    if (!linkCode) {
      controller.computeLinkCode().then((code) => {
        setLinkCode(code);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (linkCodeField.current as any).value = `${formatCode(code)}-`;
      });
    }
  });

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
            Add Device
          </Typography>
          <CancelActivationButton message="Quit adding device?" toast={toast} />
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container sx={ CacheNutStyles.paper }>
          <LinkOutlined fontSize="large" />
          Complete the link code displayed by the new device.
          <TextField fullWidth label="Link code" inputRef={linkCodeField} />
          <Button
            variant="contained"
            color="primary"
            sx={ CacheNutStyles.submit }
            onClick={(): void => {
              controller.validateLinkCode(linkCodeField.current)
              .then((validated) => {
                if (validated) {
                  navigateTo(<AddDeviceCompletedPage slide="next" />);
                }
                else {
                  toast.error('Invalid link code.');
                }
              });
            }}
          >
            Authorize
          </Button>
        </Container>
      </Slide>
      {ToastComponent(toast)}
    </>
  );
};

export interface AddDeviceLinkCodeController {
  computeLinkCode: () => Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateLinkCode: (input: any) => Promise<boolean>;
}
