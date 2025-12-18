'use client';

import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { startStepForegroundTask } from './src/foreGroundService';
import {
  queryIOSHealthKit,
  requestIOSHealthKitPermissions,
} from './src/healthKitIos';
import LogCat from './src/LogCat';
import { getStepPermission } from './src/permission';
import {
  parseStepData,
  startStepCounterUpdate,
  stopStepCounterUpdate,
} from './src/stepCounter';
import {
  getLastSensorCount,
  loadTodaySteps,
  saveLastSensorCount,
  saveTodaySteps,
} from './src/storage';

export default function App() {
  const [allowed, setAllowed] = useState(false);
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState(0);
  const [info, setInfo] = useState({ calories: '0 kCal' });
  const stepCounterStarted = useRef(false);
  const CALORIES_PER_STEP = 0.04;

  const loadIOSStepsFromHealthKit = async () => {
    if (Platform.OS !== 'ios') return;

    try {
      const healthKitSteps = await queryIOSHealthKit();
      setSteps(healthKitSteps);
      saveTodaySteps(healthKitSteps);
      console.log('[v0] Loaded iOS HealthKit steps:', healthKitSteps);
    } catch (error) {
      console.error('[v0] Error loading iOS steps:', error);
    }
  };

  const startStepCounter = async () => {
    if (stepCounterStarted.current) {
      console.log('[v0] Step counter already started, skipping...');
      return;
    }

    if (Platform.OS === 'android') {
      const existingSteps = loadTodaySteps();
      const previousSensorCount = getLastSensorCount();

      console.log(
        '[v0] Starting with existingSteps:',
        existingSteps,
        'previousSensor:',
        previousSensorCount,
      );

      let isFirstReading = true;
      let baselineSensorValue = previousSensorCount;

      startStepCounterUpdate(new Date(), raw => {
        const d = parseStepData(raw);
        console.log('[v0] Sensor reading:', d.steps);

        if (isFirstReading) {
          isFirstReading = false;

          // If sensor reset (shows 0 or very low) or is less than what we had saved
          if (d.steps < previousSensorCount) {
            console.log(
              '[v0] Sensor reset detected. Previous:',
              previousSensorCount,
              'Current:',
              d.steps,
            );
            // Sensor was reset, set new baseline
            baselineSensorValue = d.steps;
            saveLastSensorCount(d.steps);
          } else {
            // Sensor continued from before (unlikely after app kill, but handle it)
            baselineSensorValue = previousSensorCount;
          }

          setSteps(existingSteps);
          setInfo(d);
          return;
        }

        const currentSensorCount = getLastSensorCount();
        let delta = 0;

        if (d.steps >= currentSensorCount) {
          // Normal increment
          delta = d.steps - currentSensorCount;
        } else {
          // Sensor reset during runtime (rare, but possible)
          console.log('[v0] Runtime sensor reset detected');
          delta = d.steps;
          baselineSensorValue = 0;
        }

        if (delta > 0) {
          const todaySteps = loadTodaySteps();
          const totalSteps = todaySteps + delta;

          console.log(
            '[v0] Steps update - Delta:',
            delta,
            'Total:',
            totalSteps,
          );

          setSteps(totalSteps);
          setInfo(d);

          saveTodaySteps(totalSteps);
          saveLastSensorCount(d.steps);
        }
      });

      startStepForegroundTask();

      stepCounterStarted.current = true;
      setActive(true);
    } else {
      await loadIOSStepsFromHealthKit();

      // Poll HealthKit every 5 seconds while app is open
      const interval = setInterval(loadIOSStepsFromHealthKit, 5000);
      return () => clearInterval(interval);
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      console.log('[v0] AppState changed to:', state);

      if (state === 'active' && allowed) {
        console.log('[v0] App became active');

        // Reload steps from storage when app comes to foreground
        const savedSteps = loadTodaySteps();
        console.log('[v0] Reloaded steps from storage:', savedSteps);
        setSteps(savedSteps);

        // The sensor should still be running from the foreground service
        // But if it stopped (app was killed), restart it
        if (!stepCounterStarted.current) {
          console.log('[v0] Sensor not running, restarting...');
          startStepCounter();
        }
      }
    });

    return () => sub.remove();
  }, [allowed]);

  useEffect(() => {
    const initialize = async () => {
      let granted = false;

      if (Platform.OS === 'ios') {
        granted = await requestIOSHealthKitPermissions();
      } else {
        granted = await getStepPermission();
      }

      if (!granted) {
        console.log('[v0] Permission denied');
        return;
      }

      console.log('[v0] Permission granted');
      setAllowed(true);
    };

    initialize();

    return () => {
      stopStepCounterUpdate();
    };
  }, []);

  useEffect(() => {
    if (!allowed) return;

    console.log('[v0] Permission confirmed, starting step counter');

    // Load persisted steps
    const todaySteps = loadTodaySteps();
    setSteps(todaySteps);
    console.log('[v0] Loaded persisted steps:', todaySteps);

    // Start sensor
    startStepCounter();
  }, [allowed]);

  console.log(
    '[v0] Current state - Permission:',
    allowed,
    'Steps:',
    steps,
    'Platform:',
    Platform.OS,
  );

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <CircularProgress
          value={steps}
          maxValue={10000}
          radius={150}
          valueSuffix=" steps"
          subtitle={`${Math.round(steps * CALORIES_PER_STEP)} kCal`}
        />

        <LogCat active={active} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2f3774',
  },
});
