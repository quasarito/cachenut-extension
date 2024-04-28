import * as React from 'react';

import {
  AppBar,
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Collapse,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  ImageList,
  ImageListItem,
  IconButton,
  List,
  ListItemText,
  Slide,
  Toolbar,
  Tooltip,
  Typography,
  ListItemButton,
} from '@mui/material';
import {
  ExpandMoreOutlined,
  FileCopyOutlined,
  ImageOutlined,
  LinkOutlined,
  MenuOutlined,
  OpenInNewOutlined,
  RefreshOutlined,
  TextFieldsOutlined,
} from '@mui/icons-material';

import {
  activeTab,
  CacheNutStyles,
  createTab,
  navigateTo,
  sendMessage,
  slideDirection,
  SlideDirection,
  timeElapsed,
  Toast,
  ToastComponent,
} from './PageSupport';
import { AccountPage } from './AccountPage';
import {
  ClipboardContent,
  ClipboardItem,
  ClipboardTextContent,
  ClipboardUrlContent,
  resetAccount,
} from '../CacheNut/Model';
import { Logger } from '../CacheNut/Support';
import { createHttpClient } from '../CacheNut/HttpClient';
import { CopyContentPage } from './CopyContentPage';
import { UnregisteredPage } from './UnregisteredPage';

const logger = Logger('HistoryPage');

const ELLIPSIS_LENGTH = 40;
function ellipsis(text: string): string {
  let ellipsisText = text;
  if (text.length > ELLIPSIS_LENGTH) {
    ellipsisText = `${text.substr(0, ELLIPSIS_LENGTH)}...`;
  }
  return ellipsisText;
}

function ellipsisTooltip(text: string): string | JSX.Element {
  if (text?.length > ELLIPSIS_LENGTH) {
    return (
      <Tooltip title={text}>
        <span>{ellipsis(text)}</span>
      </Tooltip>
    );
  }
  return text;
}

function createHistoryController(): HistoryController {
  return {
    loadClipboardItems: async (): Promise<ClipboardItem[]> => {
      return createHttpClient().then(async (client) => client.list());
    }    
  }
}

export const HistoryPage: React.FC<{slide?: SlideDirection;mock?: HistoryController;}> = ({mock,slide}) => {
  const [ clipItems, setClipboardItems ] = React.useState([] as ClipboardItem[]);
  const [ isClipsLoaded, setClipsLoaded ] = React.useState(false);
  const [ isMenuOpen, openMenu ] = React.useState(false);
  const controller = mock || createHistoryController();
  const toggleMenuDrawer = () => (): void => {
    openMenu(true);
  };
  const toast: Toast = {} as Toast;

  React.useEffect(() => {
    if (!isClipsLoaded) {
      logger.log('Clipboard items loading...');
      controller.loadClipboardItems()
      .then((items) => {
        setClipsLoaded(true);
        setClipboardItems(items);
        logger.log('Clipboard items set', items);
      })
      .catch((err) => {
        logger.log('listError: ', err);
        setClipsLoaded(true);
        setClipboardItems([]);
        if (err.status === 403) {
          toast.prompt('Account not found.', ['Retry', 'Disconnect'])
          .then((answer) => {
            if (answer === 'Disconnect') {
              resetAccount() // remove account info from local storage
              .then(() => sendMessage({event: 'unlinked'}))
              .then(() => navigateTo(<UnregisteredPage />));
            }
            else if (answer === 'Retry') {
              setClipsLoaded(false);
            }
          });
        }
        else {
          toast.error('An error occurred. Reload the page.');
        }
      });
    }
  });

  const copyToClipboard = (content: string): (() => void) => (): void => {
    if (navigator.clipboard) {
      navigator.clipboard
      .writeText(content)
      .then(async () => toast.success('Copied to clipboard.'));
    }
    else {
      toast.error('Clipboard not available.');
    }
  };

  const elapsedOrExpiredDuration = (ts: number | Date, expires?: number | Date): string => {
    const SECONDS_TO_EXPIRED = 5;
    const expiresDate = new Date(expires || 0);
    const remaining = expiresDate.getTime() - Date.now();
    if (remaining < SECONDS_TO_EXPIRED*60*1000) {
      // timeElapsed expects a timestamp in the past for calculation, so subtract remaining from
      // current time to get duration to expiration
      return `Expires in ${timeElapsed(Date.now() - remaining)}`;
    }
    return `Added ${timeElapsed(ts)} ago`;
  };

  const CardUrl: React.FC<{url: string; ts: number | Date; expires?: number | Date;}> =
  ({url, ts, expires}) => (
    <Card variant="outlined">
      <CardHeader
        avatar={<Avatar><LinkOutlined /></Avatar>}
        title={ellipsisTooltip(url)}
        subheader={elapsedOrExpiredDuration(ts, expires)}
      />
      <CardActions>
        <Tooltip title="Copy to clipboard">
          <IconButton color="primary" size="small" onClick={copyToClipboard(url)}>
            <FileCopyOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open URL in new tab">
          <IconButton
            color="primary"
            size="small"
            onClick={(): void => { createTab(url); }}
          >
            <OpenInNewOutlined />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  const CardImage: React.FC<{url: string; ts: number | Date; expires: number | Date;}> =
  ({url, ts, expires}) => (
    <Card variant="outlined">
      <CardHeader
        avatar={<Avatar><ImageOutlined /></Avatar>}
        title={ellipsisTooltip(url)}
        subheader={elapsedOrExpiredDuration(ts, expires)}
      />
      <CardActions>
        <Tooltip title="Copy to clipboard">
          <IconButton color="primary" size="small" onClick={copyToClipboard(url)}>
            <FileCopyOutlined />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  const CardText: React.FC<{text: string; ts: number | Date; expires?: number | Date;}> =
  ({text, ts, expires}) => {
    const [expanded, setExpanded] = React.useState(false);
    const handleExpandClick = (): void => {
      setExpanded(!expanded);
    };

    return (
      <Card variant="outlined">
        <CardHeader
          avatar={<Avatar><TextFieldsOutlined /></Avatar>}
          action={
            <IconButton
              onClick={handleExpandClick}
              sx={expanded ? CacheNutStyles.expandClose : CacheNutStyles.expandOpen }
              size="large">
              <ExpandMoreOutlined />
            </IconButton>
          }
          title={ellipsis(text)}
          subheader={elapsedOrExpiredDuration(ts, expires)}
        />
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Typography>{text}</Typography>
          </CardContent>
        </Collapse>
        <CardActions>
          <Tooltip title="Copy to clipboard">
            <IconButton color="primary" size="small" onClick={copyToClipboard(text)}>
              <FileCopyOutlined />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    );
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const menuItems = () => (
    <List>
      <ListItemButton onClick={(): void => {
        createHttpClient()
        .then(async (client) => {
          const tabs = await activeTab();
          if (tabs.length > 0 && tabs[0].url) {
            await client.cache({
              type: 'url',
              url: tabs[0].url,
            } as ClipboardContent);
            setClipsLoaded(false);
            await toast.success('Tab location copied to Cache Nut.');
          }
          else {
            await toast.warning('Unable to copy tab location.');
          }
        });
      }}>
        <ListItemText primary="Copy tab location" />
      </ListItemButton>
      <ListItemButton onClick={
        (): void => {
          openMenu(false);
          navigateTo(<CopyContentPage slide="next" />);
        }}>
        <ListItemText primary="Copy clipboard content" />
      </ListItemButton>
      <Divider />
      <ListItemButton onClick={
        (): void => {
          openMenu(false);
          navigateTo(<AccountPage slide="next" />);
        }}>
        <ListItemText primary="Account" />
      </ListItemButton>
    </List>
  );

  let gridListItems: React.ReactNode;
  if (isClipsLoaded) {
    if (clipItems.length > 0) {
      gridListItems = clipItems.sort((a, b) => b.createTs - a.createTs) // reverse chronological order
      .map((item) => {
        switch (item.content.type) {
          case 'image': {
            const imageItem = item.content as ClipboardUrlContent;
            return (
              <ImageListItem key={item.createTs} style={{height: 'auto'}}>
                <CardImage url={imageItem.url} ts={item.createTs} expires={item.expiresAt} />
              </ImageListItem>
            );
          }
          case 'url': {
            const urlItem = item.content as ClipboardUrlContent;
            return (
              <ImageListItem key={item.createTs} style={{height: 'auto'}}>
                <CardUrl url={urlItem.url} ts={item.createTs} expires={item.expiresAt} />
              </ImageListItem>
            );
          }
          case 'text':
          default: {
            const textItem = item.content as ClipboardTextContent;
            return (
              <ImageListItem key={item.createTs} style={{height: 'auto'}}>
                <CardText text={textItem.text} ts={item.createTs} expires={item.expiresAt} />
              </ImageListItem>
            );
          }
        }
      });
    } else {
      gridListItems = (
        <ImageListItem style={{height: 'auto'}}>
          <Typography>Empty</Typography>
        </ImageListItem>
      );
    }
  }

  const contentBody = gridListItems ? <ImageList cols={1}>{gridListItems}</ImageList> : <CircularProgress />;
  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="Menu"
          onClick={toggleMenuDrawer()}
          size="large">
          <MenuOutlined />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Clipboard History
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          aria-label="Refresh"
          onClick={(): void => { setClipsLoaded(false); }}
          size="large">
          <RefreshOutlined />
        </IconButton>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        {contentBody}
      </Container>
    </Slide>
    {ToastComponent(toast)}
    <Drawer
      anchor="left"
      open={isMenuOpen}
      onClose={(): void => openMenu(false)}
    >
      {menuItems()}
    </Drawer>
  </>;
};

export interface HistoryController {
  loadClipboardItems(): Promise<ClipboardItem[]>;
}