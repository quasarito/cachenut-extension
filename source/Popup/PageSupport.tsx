import {
  Button,
  createMuiTheme,
  Grow,
  IconButton,
  makeStyles,
  Slide,
  Snackbar,
  SnackbarContent,
  ThemeProvider,
} from '@material-ui/core';
// eslint-disable-next-line import/no-unresolved
import { TransitionProps } from '@material-ui/core/transitions/transition';
import { Close } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';
import * as React from 'react';
import ReactDOM from 'react-dom';
import UAParser from 'ua-parser-js';

import { resetActivationData } from '../CacheNut/Model';
import { Logger } from '../CacheNut/Support';

const logger = Logger('PageSupport');

const cacheNutTheme = createMuiTheme({
  palette: {
    secondary: {
      light: 'rgba(190, 218, 37, 1)', // BEDA25
      main: 'rgba(162, 178, 20, 1)', // A2B214
      dark: 'rgba(121, 117, 0, 1)', // 797500
      contrastText: '#fff',
    },
    primary: {
      light: 'rgba(137, 209, 171, 1)', // 89D1AB
      main: 'rgba(20, 178, 115, 1)', // 14B273
      dark: 'rgba(0, 150, 81, 1)', // 009651
      contrastText: '#fff',
    },
  },
});

export const cacheNutStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  submit: {
    margin: theme.spacing(2, 0, 2),
  },
  title: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
}));

export type SlideDirection = 'next' | 'back' | 'start' | 'done';

export const slideDirection = (direction: SlideDirection | undefined): 'left' | 'right' | 'down' | 'up' => {
  switch (direction) {
    case 'next':
      return 'left';
    case 'back':
      return 'right';
    case 'done':
      return 'up';
    case 'start':
    default:
      return 'down';
  }
};

export const navigateTo = (
  page: React.ReactElement,
  Transition?: React.ComponentType<TransitionProps & {children?: React.ReactElement}>
): void => {
  const rootElement =
    document.getElementById('popup-root') ||
    document.getElementById('options-root') ||
    document.getElementById('root');
  if (Transition) {
    ReactDOM.render(
      <ThemeProvider theme={cacheNutTheme}>
        <Transition>{page}</Transition>
      </ThemeProvider>,
      rootElement
    );
  }
  else {
    ReactDOM.render(
      <ThemeProvider theme={cacheNutTheme}>{page}</ThemeProvider>,
      rootElement
    );
  }
};

export const stripNonAlphanumeric = (value: string): string => {
  if (value) {
    return value.replace(/[^a-zA-Z0-9]/g, '');
  }
  return value;
};

export const createDeviceName = (): string => {
  const ua = new UAParser();
  return `${ua.getBrowser().name || 'Unknown'} on ${ua.getOS().name || 'Unknown OS'}`;
};

/**
 * Divides the given code string into hyphen-separated fragments. If the length is not evenly
 * divisible by 3, 4 or 5, then the code is not modified.
 */
export const formatCode = (code: string, separator = '-'): string => {
  const CHUNK_SIZES = [ 5, 4, 3 ];
  const len = code.length;

  const chunkSize = CHUNK_SIZES.find((n) => len % n === 0);
  if (chunkSize) {
    const chunks = len / chunkSize;
    const fragments = [];

    for (let i = 0; i < chunks; i++) {
      fragments.push(code.substr(i * chunkSize, chunkSize));
    }
    return fragments.join(separator);
  }
  return code;
};

export const timeElapsed = (ts2: number | Date): string => {
  const ts = ts2 instanceof Date ? ts2.getTime() : ts2;
  const now = Date.now();
  const elapsed = now - ts;
  if (elapsed <= 10000) {
    return 'a moment';
  }
  if (Math.floor(elapsed / 60000) === 0) {
    // less than a minute ago
    const sec = Math.floor(elapsed / 5000) * 5;
    return `${sec} second${sec > 1 ? 's' : ''}`;
  }
  if (Math.floor(elapsed / 3600000) === 0) {
    // less than an hour ago
    const min = Math.floor(elapsed / 60000);
    return `${min} minute${min > 1 ? 's' : ''}`;
  }
  if (Math.floor(elapsed / 86400000) === 0) {
    // less than an hour ago
    const hr = Math.floor(elapsed / 3600000);
    return `${hr} hour${hr > 1 ? 's' : ''}`;
  } // more than a day ago
  const day = Math.floor(elapsed / 86400000);
  return `${day} day${day > 1 ? 's' : ''}`;
};

export const linkCodeFromPayloadHash = (payloadHash: string, length = 8): string => {
  const split = payloadHash.split('_');
  const len = length || 8; // sanity
  if (split.length === 2) {
    const hash = split[0];
    const ts = +split[1];
    const modulo = hash.length - len;
    if (modulo > 0) {
      return hash.substr(ts % modulo, len);
    }
  }
  return payloadHash;
};

export interface Toast {
  error: (message: string) => Promise<void>;
  info: (message: string) => Promise<void>;
  message: (message: string) => Promise<void>;
  success: (message: string) => Promise<void>;
  warning: (message: string) => Promise<void>;
  prompt: (message: string, answers: string[]) => Promise<string>;
}

export const ToastComponent = (
  cb: Toast,
  transition?: React.ComponentType<TransitionProps & {children?: React.ReactElement}>
): JSX.Element =>
{
  // React.ComponentType<TransitionProps & { children?: React.ReactElement<any, any> }>
  const [toastState, setToastState] = React.useState({
    message: '',
    open: false,
    transition: transition || Grow,
  });
  const [exitCallbacks, setExitCallbacks] = React.useState([] as Array<() => void>);
  const handleClose = (): void => { setToastState({...toastState, open: false}); };
  const handleExited = (): void => {
    exitCallbacks.forEach((exitCb) => exitCb());
    setExitCallbacks([]);
  };
  const clickClose = (): void => {
    handleExited();
    handleClose();
  };
  const toastContent = (message: string): JSX.Element => (
    <SnackbarContent
      message={message}
      action={
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={clickClose}
        >
          <Close fontSize="small" />
        </IconButton>
      }
    />
  );
  const [snackbarContent, setSnackbarContent] = React.useState(<></>);
  const alert = (sev: 'success' | 'info' | 'warning' | 'error') => async (message: string): Promise<void> => {
    setSnackbarContent(
      <Alert variant="filled" severity={sev} onClose={clickClose}>
        {message}
      </Alert>
    );
    setToastState({...toastState, message, open: true});
    return new Promise<void>((resolve) => {
      setExitCallbacks(exitCallbacks.concat(resolve));
      exitCallbacks.push(resolve);
    });
  };
  cb.error = alert('error');
  cb.info = alert('info');
  cb.success = alert('success');
  cb.warning = alert('warning');
  cb.message = async (message: string): Promise<void> => {
    setSnackbarContent(toastContent(message));
    setToastState({...toastState, message, open: true});
    return new Promise<void>((resolve) => {
      setExitCallbacks(exitCallbacks.concat(resolve));
      exitCallbacks.push(resolve);
    });
  };
  cb.prompt = async (message: string, answers: string[]): Promise<string> =>
    new Promise<string>((resolve) => {
      const answerActions = answers.map((answer) => (
        <Button
          color="secondary"
          size="small"
          key={answer}
          onClick={(): void => {
            handleClose();
            resolve(answer);
          }}
        >
          {answer}
        </Button>
      ));
      setSnackbarContent(
        <SnackbarContent message={message} action={answerActions} />
      );
      setToastState({
        message,
        open: true,
        transition: (props: TransitionProps) => (
          <Slide {...props} direction="up" />
        ),
      });
      setExitCallbacks(exitCallbacks.concat(() => resolve('')));
      exitCallbacks.push(() => resolve(''));
    });

  return (
    <Snackbar
      open={toastState.open}
      TransitionComponent={toastState.transition}
      key={toastState.message}
      autoHideDuration={5000}
      onClose={handleClose}
      onExited={handleExited}
    >
      {snackbarContent}
    </Snackbar>
  );
};

export const CancelActivationButton: React.FC<{message: string; toast: Toast;}> = (props) => (
  <Button
    color="default"
    onClick={(): void => {
      props.toast.prompt(props.message, ['Yes', 'No'])
      .then((answer) => {
        logger.log(`CancelActivationButton: ${answer}`);
        if (answer === 'Yes') {
          resetActivationData();
          window.close();
        }
      });
    }}
  >
    Cancel
  </Button>
);

export class PageError extends Error {
  constructor(readonly message: string, readonly thrown: unknown) {
    super();
  }
}
