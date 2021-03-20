/* eslint-disable @typescript-eslint/no-explicit-any */
import { Config } from './Config';

const { loggingEnabled } = Config;

const NullLog: Log = {
  log: () => {},
};

export const Logger = (name: string): Log => {
  if (!loggingEnabled) {
    return NullLog;
  }

  return {
    log: (message: string, ...args: any[]): void => {
      const result: any[] = [`${name}:`, message];
      args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a))
      .forEach((a) => {
        const last = result.pop();
        if (last && typeof last === 'string' && last.endsWith('=')) {
          result.push(last + a);
        }
        else {
          result.push(last);
          result.push(a);
        }
      });
      console.log(...result);
    },
  };
};

export interface Log {
  log: (message: string, ...args: any[]) => void;
}
