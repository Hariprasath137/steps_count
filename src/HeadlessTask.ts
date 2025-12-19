import {
  parseStepData,
  startStepCounterUpdate,
  stopStepCounterUpdate,
} from '@dongminyu/react-native-step-counter';
import notifee from '@notifee/react-native';
import {
  getLastSensorCount,
  loadTodaySteps,
  saveLastSensorCount,
  saveTodaySteps,
} from './storage';

export const HeadlessTask = async (notification: any) => {
  // Initial Sync
  const initialSteps = loadTodaySteps();

  await notifee.displayNotification({
    id: notification.id,
    title: 'Step Counter Active',
    body: `Steps: ${initialSteps}`,
    android: {
      ...notification.android,
      progress: {
        max: 10000,
        current: initialSteps,
        indeterminate: false,
      },
      onlyAlertOnce: true,
    },
  });

  return new Promise<void>(() => {
    console.log('Headless Task: Starting Listener...');

    // Safety Clean
    try {
      stopStepCounterUpdate();
    } catch (e) {}

    // Start Listening
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

      // Filter jumps > 500 steps in one packet
      if (delta > 500) delta = 0;

      const totalSteps = existingSteps + delta;

      // Save to MMKV (Source of Truth)
      saveTodaySteps(totalSteps);
      saveLastSensorCount(d.steps);

      console.log(`Background Update: ${totalSteps}`);

      // Update Notification
      notifee.displayNotification({
        id: notification.id,
        title: 'Step Counter Active',
        body: `Steps: ${totalSteps}`,
        android: {
          ...notification.android,
          progress: {
            max: 10000,
            current: totalSteps,
            indeterminate: false,
          },
          onlyAlertOnce: true,
        },
      });
    });
  });
};
