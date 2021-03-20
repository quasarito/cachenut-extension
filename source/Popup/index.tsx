import * as React from 'react';

import { loadAccount, loadActivationData, resetActivationData } from '../CacheNut/Model';
import { Logger} from '../CacheNut/Support';
import { AddDeviceAccessCodePage } from './AddDeviceAccessCodePage';
import { AddDeviceLinkCodePage } from './AddDeviceLinkCodePage';
import { ConnectAccessCodePage } from './ConnectAccessCodePage';
import { ConnectLinkCodePage } from './ConnectLinkCodePage';
import { HistoryPage } from './HistoryPage';
import { navigateTo } from './PageSupport';

import { UnregisteredPage } from './UnregisteredPage';

const logger = Logger('PopupIndex');

function init(): void {
  Promise.all([loadAccount().catch(() => null), loadActivationData()])
    .then(([account, activation]) => {
      if (account) {
        if (activation) {
          logger.log('Account found, activation=', activation);
          switch (activation.step) {
            case 'AccessCode':
              navigateTo(<AddDeviceAccessCodePage />);
              return;
            case 'LinkCode':
              navigateTo(<AddDeviceLinkCodePage />);
              return;
            default:
              resetActivationData();
          }
        }
        navigateTo(<HistoryPage />);
      } else {
        if (activation) {
          logger.log('No account, activation=', activation);
          switch (activation.step) {
            case 'AccessCode':
              navigateTo(<ConnectAccessCodePage />);
              return;
            case 'LinkCode':
              navigateTo(<ConnectLinkCodePage />);
              return;
            default:
              resetActivationData();
          }
        }
        navigateTo(<UnregisteredPage />);
      }
    })
    .catch((err) => {
      console.log('initError: ', err);
      navigateTo(<UnregisteredPage />);
    });
}

init();
