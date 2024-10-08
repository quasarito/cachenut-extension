import * as React from 'react';

import {
  Alert,
  AppBar,
  Button,
  Container,
  CssBaseline,
  Slide,
  Toolbar,
  Typography,
} from '@mui/material';
import { LinkOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  CancelActivationButton,
  formatCode,
  linkCodeFromPayloadHash,
  navigateTo,
  slideDirection,
  SlideDirection,
  Toast,
  ToastComponent,
} from './PageSupport';
import { ConnectDeviceNamePage } from './ConnectDeviceNamePage';
import { loadActivationData } from '../CacheNut/Model';
import { Logger } from '../CacheNut/Support';

const logger = Logger('ConnectLinkCodePage:');

function createConnectLinkCodeController(): ConnectLinkCodeController {
  return {
    computeLinkCode: async (): Promise<string> => {
      const activation = await loadActivationData();
      if (activation && activation.firstHash && activation.secondHash) {
        const fullLinkCode =
          linkCodeFromPayloadHash(activation.firstHash) +
          linkCodeFromPayloadHash(activation.secondHash).toUpperCase();
        logger.log(`linkCode=${fullLinkCode}, first=${activation.firstHash}, second=${activation.secondHash}}`);
        return fullLinkCode;
      }
      return '';
    },
  };
}

export const ConnectLinkCodePage: React.FC<{slide?: SlideDirection;mock?: ConnectLinkCodeController;}> =
  ({mock, slide}) =>
{
  const [ linkCode, setLinkCode ] = React.useState('');
  const controller = mock || createConnectLinkCodeController();
  const toast: Toast = {} as Toast;

  React.useEffect(() => {
    if (!linkCode) {
      controller
        .computeLinkCode()
        .then((code) => {
          logger.log(`linkCode=${code}`);
          if (code) {
            setLinkCode(code);
          } else {
            setLinkCode('!');
          }
        })
        .catch(() => {
          setLinkCode('!');
        });
    }
  });

  const linkExists = linkCode && linkCode !== '!';
  const linkCodePrompt = linkExists
    ? 'Enter the link code below on the active device.'
    : '';
  const linkCodeElement = linkExists ? (
    <Typography id="link_code" variant="h6" gutterBottom>
      {formatCode(linkCode, ' - ')}
    </Typography>
  ) : (
    <Alert severity="error">There was a problem obtaining an link code.</Alert>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
            Link Code
          </Typography>
          <CancelActivationButton message="Quit account connection?" toast={toast} />
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container sx={ CacheNutStyles.paper }>
          <LinkOutlined fontSize="large" />
          {linkCodePrompt}
          {linkCodeElement}
          <Button
            variant="contained"
            color="primary"
            sx={ CacheNutStyles.submit }
            onClick={(): void => {
              if (linkCode && linkCode !== '!') {
                navigateTo(<ConnectDeviceNamePage slide="next" />);
              }
              else {
                controller.computeLinkCode()
                .then((code) => {
                  if (code) {
                    setLinkCode(code);
                  }
                });
              }
            }}
          >
            {linkCode === '!' ? 'Try again' : 'Next'}
          </Button>
        </Container>
      </Slide>
      {ToastComponent(toast)}
    </>
  );
};

export interface ConnectLinkCodeController {
  computeLinkCode: () => Promise<string>;
}
