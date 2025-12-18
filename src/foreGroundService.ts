import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import { Platform } from 'react-native';

let taskAdded = false;

export const startStepForegroundTask = () => {
  if (Platform.OS !== 'android') return;
  if (taskAdded) return;

  try {
    ReactNativeForegroundService.add_task(
      async () => {
        // This task runs every 10 seconds in the background
        // It keeps the foreground service alive but the sensor itself
        // continues to track steps via the native module
        console.log('[v0] Foreground task heartbeat - keeping service alive');
      },
      {
        delay: 10000, // every 10 seconds
        onLoop: true,
        taskId: 'step.counter.task',
        onError: e => console.log('[v0] Foreground task error:', e),
        onSuccess: () => console.log('[v0] Foreground task started'),
      },
    );
    taskAdded = true;

    // Start the foreground service notification
    ReactNativeForegroundService.start({
      id: 1244,
      title: 'Step Counter Active',
      message: 'Tracking your steps in the background',
      icon: 'ic_launcher',
      button: false,
      button2: false,
      buttonText: '',
      button2Text: '',
      buttonOnPress: '',
      setOnlyAlertOnce: 'true',
      color: '#000000',
      serviceType: 'health', // Required for Android 14+ for step tracking
    } as any);

    console.log('[v0] Foreground service started');
  } catch (error) {
    console.log('[v0] Foreground service error:', error);
  }
};

export const stopAndroidForegroundService = async () => {
  if (Platform.OS !== 'android') return;

  try {
    ReactNativeForegroundService.stop();
    taskAdded = false;
    console.log('[v0] Foreground service stopped');
  } catch (error) {
    console.log('[v0] Error stopping foreground service:', error);
  }
};
