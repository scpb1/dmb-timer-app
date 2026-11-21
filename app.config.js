// @ts-check

/** @typedef {import('expo/config').ExpoConfig} ExpoConfig */

const DEV_ANDROID_PACKAGE = 'com.girlyddd.dev';
const DEV_IOS_BUNDLE_ID = 'com.girlyddd.dev';
const DEV_APP_NAME = 'girly-ddd';
const DEV_SCHEME = 'girly-ddd';

function isDevelopmentVariant() {
  return (
    process.env.APP_VARIANT === 'development' ||
    process.env.EAS_BUILD_PROFILE === 'development'
  );
}

/** @returns {ExpoConfig} */
module.exports = () => {
  /** @type {ExpoConfig} */
  const base = require('./app.json').expo;

  if (!isDevelopmentVariant()) {
    return base;
  }

  return {
    ...base,
    name: DEV_APP_NAME,
    scheme: DEV_SCHEME,
    ios: {
      ...base.ios,
      bundleIdentifier: DEV_IOS_BUNDLE_ID,
    },
    android: {
      ...base.android,
      package: DEV_ANDROID_PACKAGE,
    },
  };
};
