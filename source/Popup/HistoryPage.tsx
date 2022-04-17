import * as React from 'react';

import {
  AppBar,
  Avatar,
  Button,
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
  ListItem,
  ListItemText,
  Slide,
  Toolbar,
  Tooltip,
  Typography,
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
import { browser } from 'webextension-polyfill-ts';

import {
  CacheNutStyles,
  navigateTo,
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
} from '../CacheNut/Model';
import { Logger } from '../CacheNut/Support';
import { createHttpClient } from '../CacheNut/HttpClient';

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
  if (text.length > ELLIPSIS_LENGTH) {
    return (
      <Tooltip title={text}>
        <span>{ellipsis(text)}</span>
      </Tooltip>
    );
  }
  return text;
}

async function loadClipboardItems(): Promise<ClipboardItem[]> {
  return createHttpClient().then(async (client) => client.list());
}

export const HistoryPage: React.FC<{slide?: SlideDirection}> = ({slide}) => {
  const [ clipItems, setClipboardItems ] = React.useState([] as ClipboardItem[]);
  const [ isClipsLoaded, setClipsLoaded ] = React.useState(false);
  const [ isMenuOpen, openMenu ] = React.useState(false);
  const toggleMenuDrawer = () => (): void => {
    openMenu(true);
  };
  const toast: Toast = {} as Toast;

  React.useEffect(() => {
    if (!isClipsLoaded) {
      logger.log('Clipboard items loading...');
      loadClipboardItems()
      .then((items) => {
        setClipsLoaded(true);
        setClipboardItems(items);
        logger.log('Clipboard items set', items);
      })
      .catch((err) => {
        logger.log('listError: ', err);
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

  const CardUrl: React.FC<{url: string; ts: number | Date}> = ({url, ts}) => (
    <Card variant="outlined">
      <CardHeader
        avatar={<Avatar><LinkOutlined /></Avatar>}
        title={ellipsisTooltip(url)}
        subheader={`${timeElapsed(ts)} ago`}
      />
      <CardActions>
        <Tooltip title="Copy to clipboard">
          <Button size="small" onClick={copyToClipboard(url)}>
            <FileCopyOutlined />
          </Button>
        </Tooltip>
        <Tooltip title="Open URL in new tab">
          <Button
            size="small"
            onClick={(): void => {
              browser.tabs.create({url});
            }}
          >
            <OpenInNewOutlined />
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );

  const CardImage: React.FC<{url: string; ts: number | Date}> = ({url, ts}) => (
    <Card variant="outlined">
      <CardHeader
        avatar={<Avatar><ImageOutlined /></Avatar>}
        title={ellipsisTooltip(url)}
        subheader={`${timeElapsed(ts)} ago`}
      />
      <CardActions>
        <Tooltip title="Copy to clipboard">
          <Button size="small" onClick={copyToClipboard(url)}>
            <FileCopyOutlined />
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );

  const CardText: React.FC<{text: string; ts: number | Date}> = ({text,ts}) => {
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
            >
              <ExpandMoreOutlined />
            </IconButton>
          }
          title={ellipsis(text)}
          subheader={`${timeElapsed(ts)} ago`}
        />
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Typography>{text}</Typography>
          </CardContent>
        </Collapse>
        <CardActions>
          <Tooltip title="Copy to clipboard">
            <Button size="small" onClick={copyToClipboard(text)}>
              <FileCopyOutlined />
            </Button>
          </Tooltip>
        </CardActions>
      </Card>
    );
  };

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const menuItems = () => (
    <List>
      <ListItem button key="copyTabLocation">
        <ListItemText
          primary="Copy tab location"
          onClick={(): void => {
            createHttpClient()
            .then(async (client) => {
              const tabs = await browser.tabs.query({active: true});
              if (tabs.length > 0) {
                await client.cache({
                  type: 'url',
                  url: tabs[0].url,
                } as ClipboardContent);
                await toast.success('Tab location copied to Cache Nut.');
              }
            });
          }}
        />
      </ListItem>
      <ListItem button key="copyClipboardContent">
        <ListItemText
          primary="Copy clipboard content"
          onClick={(): void => {
            browser.runtime.sendMessage({event: 'copyclipboard'})
            .then((copied) => {
              if (copied) {
                toast.success('Clipboard copied to Cache Nut.');
              }
              else {
                toast.warning('Clipboard access not available.');
              }
            });
          }}
        />
      </ListItem>
      <Divider />
      <ListItem button key="account">
        <ListItemText
          primary="Account"
          onClick={(): void => navigateTo(<AccountPage slide="next" />)}
        />
      </ListItem>
    </List>
  );

  let gridListItems: React.ReactNode;
  if (isClipsLoaded) {
    if (clipItems.length > 0) {
      gridListItems = clipItems.map((item) => {
        switch (item.content.type) {
          case 'image': {
            const imageItem = item.content as ClipboardUrlContent;
            return (
              <ImageListItem style={{height: 'auto'}}>
                <CardImage url={imageItem.url} ts={item.createTs} />
              </ImageListItem>
            );
          }
          case 'url': {
            const urlItem = item.content as ClipboardUrlContent;
            return (
              <ImageListItem style={{height: 'auto'}}>
                <CardUrl url={urlItem.url} ts={item.createTs} />
              </ImageListItem>
            );
          }
          case 'text':
          default: {
            const textItem = item.content as ClipboardTextContent;
            return (
              <ImageListItem style={{height: 'auto'}}>
                <CardText text={textItem.text} ts={item.createTs} />
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
  } else {
    gridListItems = (
      <ImageListItem style={{height: 'auto'}}>
        <CircularProgress />
      </ImageListItem>
    );
  }
  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Menu"
            onClick={toggleMenuDrawer()}
          >
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
          >
            <RefreshOutlined />
          </IconButton>
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container sx={ CacheNutStyles.paper }>
          <ImageList cols={1}>{gridListItems}</ImageList>
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
    </>
  );
};
