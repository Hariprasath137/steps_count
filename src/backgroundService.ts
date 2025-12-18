import {
  parseStepData,
  startStepCounterUpdate,
  stopStepCounterUpdate,
} from '@dongminyu/react-native-step-counter';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import {
  getLastSensorCount,
  loadTodaySteps,
  saveLastSensorCount,
  saveTodaySteps,
} from './storage';

let isServiceRunning = false;
let stepListenerStarted = false;

export const ensureStepListener = () => {
  if (stepListenerStarted) return;

  console.log('Starting step counter listener (singleton)');
  startStepCounterListener();
  stepListenerStarted = true;
};

export const isBackgroundServiceRunning = () => {
  return isServiceRunning;
};

export const startBackgroundService = () => {
  // Check if service is already running
  const running = ReactNativeForegroundService.is_running();
  ensureStepListener();
  if (running) {
    console.log('Native service already running');
    isServiceRunning = true;
    return;
  }

  console.log('Start Service Triggered');

  // Configure the notification with foregroundServiceType
  ReactNativeForegroundService.add_task(
    () => {
      // This task runs in the background
      console.log('Background step counter task is running');
    },
    {
      delay: 5000,
      onLoop: true,
      taskId: 'stepCounterTask',
      onError: e => console.log('Error in background task:', e),
    },
  );

  // Start the foreground service with notification and serviceType
  ReactNativeForegroundService.start({
    id: 1244,
    title: 'Step Counter Active',
    message: 'Counting your steps...',
    icon: 'ic_launcher',
    button: false,
    button2: false,
    setOnlyAlertOnce: 'true',
    color: '#00C4D1',
    progress: {
      max: 10000,
      curr: loadTodaySteps(),
    },
    // CRITICAL: Add foregroundServiceType for Android 14+
    serviceType: 'health', // 1 = health type
  } as any);

  isServiceRunning = true;

  // Only start step counter listener if not already started
  //   if (!stepListenerStarted) {
  //     console.log('Starting step counter listener');
  //     startStepCounterListener();
  //     stepListenerStarted = true;
  //   }
};

const startStepCounterListener = () => {
  // Start step counter
  startStepCounterUpdate(new Date(), raw => {
    const d = parseStepData(raw);
    const previousSensorCount = getLastSensorCount();
    const existingSteps = loadTodaySteps();

    let delta = 0;
    if (d.steps >= previousSensorCount) {
      delta = d.steps - previousSensorCount;
    } else {
      // Sensor reset, use the full value
      delta = d.steps;
    }

    const totalSteps = existingSteps + delta;

    console.log('Background - Sensor:', d.steps);
    console.log('Background - Total:', totalSteps);

    saveTodaySteps(totalSteps);
    saveLastSensorCount(d.steps);

    // Update notification with current steps
    if (isServiceRunning) {
      console.log(' Update Service Triggered');
      try {
        ReactNativeForegroundService.update({
          id: 1244,
          title: 'Step Counter Active',
          message: `${totalSteps} steps today`,
          progress: {
            max: 10000,
            curr: totalSteps,
          },
          serviceType: 'health',
        } as any);
      } catch (error) {
        console.log('Error updating notification:', error);
      }
    }
  });
};

export const stopBackgroundService = () => {
  if (!isServiceRunning) {
    console.log('Service is not running');
    return;
  }

  console.log('Stopping background service');
  stopStepCounterUpdate();
  ReactNativeForegroundService.remove_task('stepCounterTask');
  ReactNativeForegroundService.stop();
  isServiceRunning = false;
  stepListenerStarted = false;
};

export const updateNotificationSteps = (steps: number, calories: string) => {
  if (isServiceRunning) {
    console.log(' Update Service Triggered');
    try {
      ReactNativeForegroundService.update({
        id: 1244,
        title: 'Step Counter Active',
        message: `${steps} steps • ${calories}`,
        progress: {
          max: 10000,
          curr: steps,
        },
      });
    } catch (error) {
      console.log('Error updating notification:', error);
    }
  }
};
