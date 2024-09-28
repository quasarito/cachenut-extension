import * as React from 'react';

import {
  Alert,
  AppBar,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Slide,
  Switch,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowBackOutlined, DeleteOutlined, VerifiedUserOutlined } from '@mui/icons-material';

import {
  CacheNutStyles,
  navigateTo,
  slideDirection,
  SlideDirection,
  timeElapsed,
  Toast,
  ToastComponent
} from './PageSupport';
import { Logger } from '../CacheNut/Support';
import { AccountPage } from './AccountPage';
import { CacheNutAccount, Device, loadAccount } from '../CacheNut/Model';
import { createHttpClient } from '../CacheNut/HttpClient';

const logger = Logger('ManageDevicesPage:');

function createManageDevicesController(): ManageDevicesController {
  return {
    getAccount: async (): Promise<CacheNutAccount> => {
      return loadAccount();
    },
    loadDeviceList: async (): Promise<Device[]> => {
      return createHttpClient().then(async (client) => client.loadDeviceList());
    },
    removeDevice: async (deviceId: string): Promise<boolean> => {
      return createHttpClient().then(async (client) => client.removeDevice(deviceId));
    },
    updateDevice: async (deviceId: string, isTrusted: boolean): Promise<boolean> => {
      return createHttpClient()
      .then(async (client) => client.updateDevice(deviceId, { manageDevice: isTrusted }));
    }
  }
}

export const ManageDevicesPage: React.FC<{slide?: SlideDirection, mock?: ManageDevicesController;}> =
({slide, mock}) => {

  const [ account, setAccount ] = React.useState({} as CacheNutAccount);
  const [ deviceList, setDeviceList ] = React.useState([] as Device[]);
  const controller = mock || createManageDevicesController();
  const toast: Toast = {} as Toast;

  React.useEffect(() => {
    if (!account.id) {
      controller.getAccount()
      .then((acct) => {
        if (acct.id) {
          setAccount(acct);
          if (deviceList.length === 0) {
            controller.loadDeviceList()
              .then((devices) => setTimeout(() => setDeviceList(devices), 250))
              .catch((err) => {
                logger.log(err);
              });
          }
        }
      })
      .catch((err) => {
        logger.log(err);
      });
    }
  });

  const updateTrustedDevice = (deviceId: string, isTrusted: boolean): void => {
    controller.updateDevice(deviceId, isTrusted)
    .then((updated) => {
      if (updated) {
        const updatedDevice = deviceList.find(
          (device) => device.deviceId === deviceId
        );
        if (updatedDevice) {
          updatedDevice.manageDevice = isTrusted;
        }
      }
      else {
        logger.log(`Could not update device: ${deviceId}`);
        toast.error('Device not updated');
      }
      setDeviceList(deviceList);
    })
    .catch((err) => {
      logger.log(`Could not update device: ${deviceId}`, err);
      if (err.status === 403) {
        toast.error('Not allowed from this browser.');
      }
      else {
        toast.error('Device not updated.');
      }
      setDeviceList(deviceList);
    });
  };

  const deviceListItems = account?.id
    && deviceList.map((device, idx) => (
        <ListItem key={device.deviceId + Date.now()}>
          <ListItemIcon>
            <Tooltip
              title={device.manageDevice ? 'Trusted' : 'Shared'}
              enterDelay={1000}
            >
              <Switch
                edge="start"
                onChange={(event): void => { updateTrustedDevice(device.deviceId, event.target.checked); }}
                checked={device.manageDevice}
              />
            </Tooltip>
          </ListItemIcon>
          <Tooltip
            title={`Device id: ${device.deviceId}, registered: ${device.createDate.toLocaleString()}`}
            enterDelay={1000}>
            <ListItemText
              id={`device_item_${idx}`}
              primary={device.name}
              secondary={
                (account.deviceId === device.deviceId) ? 'This browser'
                  : `First access: ${timeElapsed(device.createDate)} ago`
              }
            />
          </Tooltip>
          <ListItemSecondaryAction>
            <Tooltip title="Remove device from account" enterDelay={1000}>
              <IconButton
                edge="end"
                onClick={(): void => {
                  toast.prompt(`Permanently remove ${device.name}?`, ['Yes', 'No'])
                  .then((answer) => {
                    if (answer === 'Yes') {
                      controller.removeDevice(device.deviceId)
                      .then((updated) => {
                        if (updated) {
                          toast.success('Device removed.');
                          setDeviceList(deviceList.filter((d) => d.deviceId !== device.deviceId));
                        }
                        else {
                          logger.log(`Could not remove device: ${device.deviceId}`);
                          toast.error('Failed to remove device.');
                        }
                      })
                      .catch((err) => {
                        logger.log(`Could not remove device: ${device.deviceId}`, err);
                        if (err.status === 403) {
                          toast.error('Not allowed from this browser.');
                        }
                        else {
                          toast.error('Failed to remove device.');
                        }
                      });
                    }
                  });
                }}
                size="large">
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ));

  return <>
    <AppBar position="static">
      <Toolbar variant="dense">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="back"
          onClick={(): void => navigateTo(<AccountPage slide="back" />)}
          size="large">
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" color="inherit" sx={ CacheNutStyles.title }>
          Manage Devices
        </Typography>
      </Toolbar>
    </AppBar>
    <CssBaseline />
    <Slide direction={slideDirection(slide)} in>
      <Container sx={ CacheNutStyles.paper }>
        <Typography variant="subtitle1">
          Trusted device <VerifiedUserOutlined />: enable only for devices that are not shared with other people.
          These devices will have additional options enabled.
        </Typography>
        <div>
          {deviceListItems?.length > 0
            ? (
              <List>
                <ListItem key="heading">
                  <ListItemIcon>
                    <Tooltip title="Trusted device">
                      <VerifiedUserOutlined />
                    </Tooltip>
                  </ListItemIcon>
                  <ListItemText primary="Device" />
                </ListItem>
                <Divider />
                {deviceListItems}
              </List>
              )
            : (deviceListItems?.length === 0
                ? <CircularProgress />
                : <Alert severity="error">Device list not available at the moment</Alert>)
          }
        </div>
      </Container>
    </Slide>
    {ToastComponent(toast)}
  </>;
};

export interface ManageDevicesController {
  getAccount(): Promise<CacheNutAccount>;
  loadDeviceList(): Promise<Device[]>;
  removeDevice(deviceId: string): Promise<boolean>;
  updateDevice(deviceId: string, isTrusted: boolean): Promise<boolean>;
}
