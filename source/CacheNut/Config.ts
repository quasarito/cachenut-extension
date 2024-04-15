declare var IS_DEV_BUILD: boolean;

export const Config = {
  baseUrl: 'https://api.cachenut.com/api/v1',
  loggingEnabled: IS_DEV_BUILD
};
