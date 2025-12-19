/**
 * @format
 */

import notifee from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { HeadlessTask } from './src/HeadlessTask';

// Register the Headless Task
notifee.registerForegroundService(HeadlessTask);

AppRegistry.registerComponent(appName, () => App);
