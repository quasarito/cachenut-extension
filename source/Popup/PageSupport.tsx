/* eslint-disable react-hooks/rules-of-hooks */
import {
  Alert,
  Button,
  Grow,
  IconButton,
  Slide,
  SlideProps,
  Snackbar,
  SnackbarContent,
  SxProps,
  ThemeProvider,
  StyledEngineProvider,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Close } from '@mui/icons-material';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import UAParser from 'ua-parser-js';

import { resetActivationData } from '../CacheNut/Model';
import { Logger } from '../CacheNut/Support';

const logger = Logger('PageSupport');

const cacheNutTheme = createTheme({
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

export const CacheNutStyles = {
  paper: {
    my: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as SxProps,
  submit: {
    mx: 0,
    my: 2
  } as SxProps,
  title: {
    flexGrow: 1,
  } as SxProps,
  menuButton: {
    mr: 2,
  } as SxProps,
  expandClose: {
    transform: 'rotate(0deg)',
    ml: 'auto',
    transition: "transform 250ms"
  } as SxProps,
  expandOpen: {
    transform: 'rotate(180deg)',
    transition: "transform 250ms"
  } as SxProps
};

export type SlideDirection = 'next' | 'back' | 'start' | 'done';

export const slideDirection = (direction?: SlideDirection): 'left' | 'right' | 'down' | 'up' => {
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

const findRoot = () => {
  let rootElement = document.getElementById('popup-root')
    || document.getElementById('options-root')
    || document.getElementById('root');
  if (!rootElement) {
    // may be loaded in storybook
    rootElement = document.getElementById('storybook-root')
      || document.querySelector('div[id^="story--example"][id$="page--primary-inner"]');
  }

  return createRoot(rootElement);
};

const appRoot = findRoot();
export const navigateTo = (page: React.ReactElement): void => {
  appRoot.render(
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={cacheNutTheme}>{page}</ThemeProvider>
    </StyledEngineProvider>
  );
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
  // close: () => void;
}

export const ToastComponent = (
  cb: Toast,
  transition?: React.ComponentType<SlideProps>
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
    exitCallbacks.forEach(exitCb => exitCb());
    setExitCallbacks([]);
  };
  const closeToast = (): void => {
    handleClose();
    handleExited();
  };
  const toastContent = (message: string): JSX.Element => (
    <SnackbarContent
      message={message}
      action={
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={closeToast}
        >
          <Close fontSize="small" />
        </IconButton>
      }
    />
  );
  const [snackbarContent, setSnackbarContent] = React.useState(<></>);
  const alert = (sev: 'success' | 'info' | 'warning' | 'error') => async (message: string): Promise<void> => {
    setSnackbarContent(
      <Alert variant="filled" severity={sev} onClose={closeToast}>
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
        // eslint-disable-next-line react/display-name
        transition: (props: SlideProps) => (<Slide {...props} direction="up" />),
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
      // onClose={(event, reason) => {
      //   if (reason != 'timeout') {
      //     closeToast();
      //   }
      // }}
    >
      {snackbarContent}
    </Snackbar>
  );
};

export const CancelActivationButton: React.FC<{message: string; toast: Toast; disabled?: boolean}> =
({ message, toast, disabled=false }) => (
  <Button
    color="inherit" // was "default"
    disabled={disabled}
    onClick={(): void => {
      toast.prompt(message, ['Yes', 'No'])
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

export const validatingTextField = (disableError: boolean = false, defaultValue?: string) => {
  const fieldRef = React.useRef<any>();
  const [ fieldValue, setFieldValue ] = React.useState(
    fieldRef.current ? fieldRef.current.value : (defaultValue || ''));

  return {
    inputRef: fieldRef,
    setValue: setFieldValue,
    value: fieldValue as string,
    disableInput: !fieldRef.current ? !defaultValue : fieldRef.current.value.trim().length === 0,
    textFieldProps: {
      defaultValue,
      error: disableError ? false : fieldValue.trim().length === 0,
      inputRef: fieldRef,
      onChange: (evt: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setFieldValue(evt.target.value)
    }
  };
}

// Note: webextension-polyfill is lazy-imported to avoid errors in Storybook
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendMessage = async (message: any) => {
  const browser = await import('webextension-polyfill');
  return browser.runtime.sendMessage(message);
};

export const createTab = async (url: string) => {
  const browser = await import('webextension-polyfill');
  return browser.tabs.create({url});
};

export const activeTab = async () => {
  const browser = await import('webextension-polyfill');
  return browser.tabs.query({active: true});
};