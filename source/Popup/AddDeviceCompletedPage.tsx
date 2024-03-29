import * as React from 'react';

import {
  AppBar,
  Button,
  Container,
  CssBaseline,
  Slide,
  Toolbar,
  Typography,
} from '@mui/material';
import { DoneOutlineOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  navigateTo,
  slideDirection,
  SlideDirection,
} from './PageSupport';
import { AccountPage } from './AccountPage';
import { resetActivationData } from '../CacheNut/Model';

export const AddDeviceCompletedPage: React.FC<{slide?: SlideDirection}> = ({slide}) => {
  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Finish
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        <DoneOutlineOutlined fontSize="large" />
        Please complete the steps on the new device.
        <Button
          variant="contained"
          color="primary"
          sx={ CacheNutStyles.submit }
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
  </>;
};
