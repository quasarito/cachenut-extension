import * as React from 'react';

import { AppBar, Button, Container, CssBaseline, IconButton, Slide, Toolbar, Typography } from '@mui/material';
import { AccountBox, AccountBoxOutlined } from '@mui/icons-material';

import { CacheNutStyles, navigateTo, slideDirection, SlideDirection } from './PageSupport';
import { NewAccountPage } from './NewAccountPage';
import { ConnectAccessCodePage } from './ConnectAccessCodePage';

export const UnregisteredPage: React.FC<{slide?: SlideDirection}> = ({slide}) => {
  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton edge="start" color="inherit" aria-label="menu" size="large">
          <AccountBox />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Cache Nut Account
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        <AccountBoxOutlined fontSize="large" />
        <Button
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          onClick={(): void => navigateTo(<NewAccountPage />)}
        >
          Register this device
        </Button>
        <Button
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
          onClick={(): void => navigateTo(<ConnectAccessCodePage />)}
        >
          Connect to another device
        </Button>
      </Container>
    </Slide>
  </>;
};
