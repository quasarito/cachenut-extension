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
import { ArrowBackOutlined, ContentPasteGo, Send } from '@mui/icons-material';

import {
  CacheNutStyles,
  navigateTo,
  slideDirection,
  SlideDirection,
  Toast,
  ToastComponent,
} from './PageSupport';
import { Logger } from '../CacheNut/Support';
import { HistoryPage } from './HistoryPage';
import { createHttpClient } from '../CacheNut/HttpClient';
import { createClipboardContent } from '../CacheNut/Model';

const logger = Logger('CopyContentPage');

function createCopyContentController(): CopyContentController {
  return {
    copy: async (content: string): Promise<boolean> => {
      logger.log('copy:', content);
      const item = createClipboardContent(content);
      return createHttpClient()
      .then(async (client) => client.cache(item))
      .then(() => true)
      .catch(err => {
        logger.log('copyError:', err);
        return false;
      });
    }
  };
}

export const CopyContentPage: React.FC<{slide?: SlideDirection; mock?: CopyContentController;}> = ({mock, slide}) => {
  const contentField = React.useRef() as React.MutableRefObject<HTMLInputElement>;
  const toast: Toast = {} as Toast;
  const controller = mock || createCopyContentController();
  const [ copying, setCopying ] = React.useState(false);

  React.useEffect(() => {
    const contentInput = contentField.current;
    if (!contentInput?.value) {
      setTimeout(() => {
        contentInput.select();
        document.execCommand('paste');
        if (contentInput.value.length > 0) {
          toast.info("Clipboard contents found");
        }
      }, 500);
    }
  });

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={(): void => navigateTo(<HistoryPage slide="back" />)}
          size="large">
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Paste from Clipboard
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        <ContentPasteGo fontSize="large" />
        Copy content to CacheNut.
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          margin="dense"
          label="Paste content here"
          multiline
          required
          rows={5}
          inputRef={contentField}
        />
        <LoadingButton
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          loading={copying}
          loadingPosition="end"
          endIcon={<Send />}
          onClick={(): void => {
            const contentInput = contentField.current;
            if (contentInput?.value) {
              setCopying(true);
              controller.copy(contentInput.value)
              .then(copied => {
                setCopying(false);
                if (copied) {
                  toast.success("Copied");
                }
                else {
                  toast.error("Unable to copy. Try again.");
                }
              });
            }
            else {
              toast.warning("Nothing copied");
            }
          }}
        >
          Copy to CacheNut
        </LoadingButton>
      </Container>
    </Slide>
    {ToastComponent(toast)}
  </>;
};

export interface CopyContentController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  copy: (content: any) => Promise<boolean>;
}
