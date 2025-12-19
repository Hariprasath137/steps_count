import {
  parseStepData,
  startStepCounterUpdate,
  stopStepCounterUpdate,
} from '@dongminyu/react-native-step-counter';
import { Platform } from 'react-native';
import {
  getLastSensorCount,
  loadTodaySteps,
  saveLastSensorCount,
  saveTodaySteps,
} from './storage';

let ReactNativeForegroundService: any = null;
if (Platform.OS === 'android') {
  ReactNativeForegroundService =
    require('@supersami/rn-foreground-service').default;
}

// FLAG TO PREVENT RACE CONDITIONS
let isServiceReady = false;

export const startStepCounterListener = () => {
  console.log('Initializing Step Counter Listener...');

  // Safe cleanup
  try {
    stopStepCounterUpdate();
  } catch (e) {
    console.log(e);
  }

  startStepCounterUpdate(new Date(), raw => {
    const d = parseStepData(raw);
    const previousSensorCount = getLastSensorCount();
    const existingSteps = loadTodaySteps();

    let delta = 0;
    if (d.steps >= previousSensorCount) {
      delta = d.steps - previousSensorCount;
    } else {
      delta = d.steps;
    }

    if (delta > 1000) delta = 0; // Filter jumps

    const totalSteps = existingSteps + delta;

    console.log(
      `Step Event: Sensor=${d.steps} | Delta=${delta} | Total=${totalSteps}`,
    );

    saveTodaySteps(totalSteps);
    saveLastSensorCount(d.steps);

    // CRITICAL FIX: Only update if service is marked ready
    if (Platform.OS === 'android' && isServiceReady) {
      updateNotificationSteps(totalSteps, '0 kCal'); // Pass calories if available
    }
  });
};

export const startBackgroundService = () => {
  if (Platform.OS !== 'android') return;

  // 1. Start the listener logic
  startStepCounterListener();

  // 2. Start the Service
  if (ReactNativeForegroundService.is_running()) {
    console.log('Service is already running');
    isServiceReady = true; // Mark as ready immediately
    return;
  }

  console.log('Starting Foreground Service...');

  ReactNativeForegroundService.add_task(
    () => console.log('Headless JS Heartbeat'),
    {
      delay: 10000,
      onLoop: true,
      taskId: 'stepCounterHeartbeat',
      onError: (e: string) => console.log('Headless Task Error:', e),
    },
  );

  // 3. Start Service with specific ID
  ReactNativeForegroundService.start({
    id: 1244,
    title: 'Step Counter Active',
    message: 'Counting steps...',
    icon: 'ic_launcher',
    button: false,
    button2: false,
    setOnlyAlertOnce: true,
    color: '#00C4D1',
    // CRITICAL: Ensure this is 'health' to match Manifest
    serviceType: 'health',
    ServiceType: 'health',
  });

  // 4. Mark ready so updates can happen
  isServiceReady = true;
};

export const stopBackgroundService = () => {
  if (Platform.OS === 'android') {
    try {
      isServiceReady = false; // Stop updates immediately
      stopStepCounterUpdate();
      ReactNativeForegroundService.remove_task('stepCounterHeartbeat');
      ReactNativeForegroundService.stop();
    } catch (e) {
      console.log('Error stopping service', e);
    }
  } else {
    stopStepCounterUpdate();
  }
};

export const updateNotificationSteps = (steps: number, calories: string) => {
  // Double check service is running to prevent crash
  if (Platform.OS === 'android' && ReactNativeForegroundService.is_running()) {
    try {
      ReactNativeForegroundService.update({
        id: 1244,
        title: 'Step Counter Active',
        message: `${steps} steps • ${calories}`,
        icon: 'ic_launcher',
        // FIX: REMOVED serviceType here. You cannot change type during update.
      });
    } catch (e) {
      console.log('Update error (ignored):', e);
    }
  }
};
