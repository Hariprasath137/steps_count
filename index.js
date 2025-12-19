/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

if (Platform.OS === 'android') {
  try {
    const ReactNativeForegroundService =
      require('@supersami/rn-foreground-service').default;

    // CHANGE: Pass an empty config object to prevent the crash
    ReactNativeForegroundService.register({
      config: {
        alert: true,
        onServiceErrorCallBack: () => {
          console.warn('[ForegroundService] Error callback triggered');
        },
      },
    });
  } catch (e) {
    console.error('Failed to register Foreground Service:', e);
  }
}
AppRegistry.registerComponent(appName, () => App);
