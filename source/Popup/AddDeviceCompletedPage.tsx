import * as React from 'react';

import {
  AppBar,
  Button,
  Container,
  CssBaseline,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from '@material-ui/core';
import {ArrowBackOutlined, DoneOutlineOutlined} from '@material-ui/icons';

import {
  cacheNutStyles,
  navigateTo,
  slideDirection,
  SlideDirection,
} from './PageSupport';
import { AccountPage } from './AccountPage';
import { resetActivationData } from '../CacheNut/Model';
import { AddDeviceLinkCodePage } from './AddDeviceLinkCodePage';

export const AddDeviceCompletedPage: React.FC<{slide?: SlideDirection}> = ({slide}) => {
  const classes = cacheNutStyles();

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={(): void => navigateTo(<AddDeviceLinkCodePage slide="back" />)}
          >
            <ArrowBackOutlined />
          </IconButton>
          <Typography variant="h6" color="inherit" className={classes.title}>
            Finish
          </Typography>
        </Toolbar>
      </AppBar>
      <CssBaseline />
      <Slide direction={slideDirection(slide)} in>
        <Container className={classes.paper}>
          <DoneOutlineOutlined fontSize="large" />
          Please complete the steps on the new device.
          <Button
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={(): void => {
              resetActivationData()
              .then(() => { navigateTo(<AccountPage />); })
              .catch(() => { navigateTo(<AccountPage />); });
            }}
          >
            Done
          </Button>
        </Container>
      </Slide>
    </>
  );
};
