import notifee, {
  AndroidColor,
  AndroidForegroundServiceType,
  AndroidImportance,
} from '@notifee/react-native';
import { stopStepCounterUpdate } from '@dongminyu/react-native-step-counter';
import { Platform, Alert } from 'react-native';
import { loadTodaySteps } from './storage';

export const startBackgroundService = async () => {
  if (Platform.OS !== 'android') return;

  // 1. Setup Channel
  const channelId = await notifee.createChannel({
    id: 'step_counter',
    name: 'Step Counter Channel',
    importance: AndroidImportance.LOW,
  });

  // 2. Optimization: Check Battery Settings
  const batteryOptimizationEnabled = await notifee.isBatteryOptimizationEnabled();
  if (batteryOptimizationEnabled) {
    Alert.alert(
      'Restriction Detected',
      'To enable background step counting, please disable Battery Optimization for this app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: async () => await notifee.openBatteryOptimizationSettings() 
        }
      ],
      { cancelable: false }
    );
  }

  // 3. Load initial data
  const currentSteps = loadTodaySteps();

  // 4. Start/Update the Service
  await notifee.displayNotification({
    id: '1244',
    title: 'Step Counter Active',
    body: `Steps: ${currentSteps}`,
    android: {
      channelId,
      asForegroundService: true,
      color: AndroidColor.BLUE,
      ongoing: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_HEALTH,
      ],
      smallIcon: 'ic_launcher',
      progress: {
        max: 10000,
        current: currentSteps,
        indeterminate: false,
      },
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const stopBackgroundService = async () => {
  try {
    stopStepCounterUpdate();
    await notifee.stopForegroundService();
  } catch (e) {
    console.log('Error stopping service', e);
  }
};

export const updateNotificationSteps = () => {};