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
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemText,
  Slide,
  Toolbar,
  Tooltip,
  Typography,
  ListItemButton,
  Fab,
  Zoom,
  Stack,
} from '@mui/material';
import {
  AddOutlined,
  ContentCopyOutlined,
  ExpandMoreOutlined,
  ImageOutlined,
  LinkOutlined,
  MenuOutlined,
  OpenInNewOutlined,
  PreviewOutlined,
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
import { Options } from '../Options/Options';
import { UnregisteredPage } from './UnregisteredPage';

declare var IS_EXTENSION_BUILD: boolean;
// eslint-disable-next-line n/no-unsupported-features/node-builtins
declare var navigator: Navigator;

const logger = Logger('HistoryPage');

function ellipsisTooltip(text: string): string | JSX.Element {
  return (
    <Tooltip title={text}>
      <span>{text}</span>
    </Tooltip>
  );
}

function createHistoryController(): HistoryController {
  return {
    loadClipboardItems: async (): Promise<ClipboardItem[]> => {
      return createHttpClient().then(async (client) => client.list());
    }    
  }
}

const CardStyle = {
  width: '100%'
}

export const HistoryPage: React.FC<{slide?: SlideDirection;mock?: HistoryController;}> =
({mock,slide}) => {
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

  const CardUrl: React.FC<{url: string; ts: number | Date; expires?: number | Date; id?: string}> =
  ({url, ts, expires, id}) => (
    <Card id={id} variant="outlined" sx={CardStyle}>
      <CardHeader
        avatar={<Avatar><LinkOutlined /></Avatar>}
        sx={{ '& .MuiCardHeader-content': {overflow: "hidden"} }}
        title={ellipsisTooltip(url)}
        titleTypographyProps={{noWrap: true, component: "p"}}
        subheader={elapsedOrExpiredDuration(ts, expires)}
      />
      <CardActions>
        <Tooltip title="Copy to clipboard">
          <IconButton color="primary" size="small" onClick={copyToClipboard(url)}>
            <ContentCopyOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open location in new tab">
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

  const CardImage: React.FC<{url: string; ts: number | Date; expires: number | Date; id?: string}> =
  ({url, ts, expires, id}) => (
    <Card id={id} variant="outlined" sx={CardStyle}>
      <CardHeader
        avatar={<Avatar><ImageOutlined /></Avatar>}
        sx={{ '& .MuiCardHeader-content': {overflow: "hidden"} }}
        title={ellipsisTooltip(url)}
        titleTypographyProps={{noWrap: true, component: "p"}}
        subheader={elapsedOrExpiredDuration(ts, expires)}
      />
      <CardActions>
        <Tooltip title="Copy location to clipboard">
          <IconButton color="primary" size="small" onClick={copyToClipboard(url)}>
            <ContentCopyOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="View image in new tab">
          <IconButton
            color="primary"
            size="small"
            onClick={(): void => { createTab(url); }}
          >
            <PreviewOutlined />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  const CardText: React.FC<{text: string; ts: number | Date; expires?: number | Date; id?: string}> =
  ({text, ts, expires, id}) => {
    const [expanded, setExpanded] = React.useState(false);
    const handleExpandClick = (): void => {
      setExpanded(!expanded);
    };

    return (
      <Card id={id} variant="outlined" sx={CardStyle}>
        <CardHeader
          avatar={<Avatar><TextFieldsOutlined /></Avatar>}
          action={
            <IconButton
              onClick={handleExpandClick}
              sx={expanded ? CacheNutStyles.expandClose : CacheNutStyles.expandOpen }
              size="medium">
              <ExpandMoreOutlined />
            </IconButton>
          }
          sx={{ '& .MuiCardHeader-content': {overflow: "hidden"} }}
          title={text}
          titleTypographyProps={{noWrap: true, component: "p"}}
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
              <ContentCopyOutlined />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
    );
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const menuItems = () => {
    const items = [
      <ListItemButton key="copy-cb-content" onClick={
        (): void => {
          openMenu(false);
          navigateTo(<CopyContentPage slide="next" />);
        }}>
        <ListItemText primary="Copy clipboard content" />
      </ListItemButton>,
      <Divider key="e" />,
      <ListItemButton key="account" onClick={
        (): void => {
          openMenu(false);
          navigateTo(<AccountPage slide="next" />);
        }}>
        <ListItemText primary="Account" />
      </ListItemButton>
    ];

    if (IS_EXTENSION_BUILD) {
      items.unshift( // add to the top of menu
        <ListItemButton key="copy-tab-location" onClick={(): void => {
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
      );
    }
    else {
      items.push( // add to the bottom of menu
        <ListItemButton key="options" onClick={(): void => {
          openMenu(false);
          navigateTo(<Options />);
        }}>
          <ListItemText primary="Options" />
        </ListItemButton>
      );
    }

    return (<List>{items}</List>);
  }

  let gridListItems: React.ReactNode;
  if (isClipsLoaded) {
    if (clipItems.length > 0) {
      gridListItems = clipItems.sort((a, b) => b.createTs - a.createTs) // reverse chronological order
      .map((item, idx) => {
        switch (item.content.type) {
          case 'image': {
            const imageItem = item.content as ClipboardUrlContent;
            return <CardImage id={`history_item_${idx+1}`}
                    key={item.createTs} url={imageItem.url} ts={item.createTs} expires={item.expiresAt} />;
          }
          case 'url': {
            const urlItem = item.content as ClipboardUrlContent;
            return <CardUrl id={`history_item_${idx+1}`}
                    key={item.createTs} url={urlItem.url} ts={item.createTs} expires={item.expiresAt} />;
          }
          case 'text':
          default: {
            const textItem = item.content as ClipboardTextContent;
            return <CardText id={`history_item_${idx+1}`}
                    key={item.createTs} text={textItem.text} ts={item.createTs} expires={item.expiresAt} />;
          }
        }
      });
    } else {
      gridListItems = <Typography>Empty</Typography>;
    }
  }

  const contentBody = gridListItems ?? <CircularProgress />;
  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
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
      <Stack sx={{...CacheNutStyles.paper, padding: '0 16px'}} spacing={1/2}>
        {contentBody}
      </Stack>
    </Slide>
    <Zoom in={true} timeout={950}>
      <Fab size="medium" color="primary" sx={ { position: 'absolute', bottom: 16, right: 16} }
        onClick={() => navigateTo(<CopyContentPage slide="next" />)}>
        <AddOutlined />
      </Fab>
    </Zoom>
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