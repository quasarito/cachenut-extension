import * as React from 'react';

import { AppBar, Button, Container, CssBaseline, IconButton, Slide, Toolbar, Typography } from '@material-ui/core';
import { AccountBox, AccountBoxOutlined } from '@material-ui/icons';

import { cacheNutStyles, navigateTo, slideDirection, SlideDirection } from './PageSupport';
import { NewAccountPage } from './NewAccountPage';
import { ConnectAccessCodePage } from './ConnectAccessCodePage';

export const UnregisteredPage: React.FC<{slide?: SlideDirection}> = ({slide}) => {
  const classes = cacheNutStyles();

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" aria-label="menu">
            <AccountBox />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.title}>
            Cache Nut Account
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container className={classes.paper}>
          <AccountBoxOutlined fontSize="large" />
          <Button
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={(): void => navigateTo(<NewAccountPage />)}
          >
            Create a new account
          </Button>
          <Button
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={(): void => navigateTo(<ConnectAccessCodePage />)}
          >
            Connect to an account
          </Button>
        </Container>
      </Slide>
    </>
  );
};
