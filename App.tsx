'use client';

import {
  parseStepData,
  startStepCounterUpdate,
  stopStepCounterUpdate,
} from '@dongminyu/react-native-step-counter';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import CircularProgress from 'react-native-circular-progress-indicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogCat from './src/LogCat';
import { getStepPermission } from './src/permission';
import {
  loadLastHardwareValue,
  loadTodaySteps,
  saveLastHardwareValue,
  saveTodaySteps,
} from './src/storage';

// --- BACKGROUND TASK LOGIC ---

const sleep = (time: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), time));

// Keep your imports and other code the same.
// ONLY REPLACE THE 'veryIntensiveTask' FUNCTION with this:

const veryIntensiveTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;

  // Load the last known hardware value from disk so we don't start at 0
  let previousHardwareValue = loadLastHardwareValue();
  let isBaselineEstablished = previousHardwareValue > 0;

  console.log(
    `BG Service: Starting Loop. Previous HW Value: ${previousHardwareValue}`,
  );

  // --- THE INFINITE LOOP ---
  // We restart the sensor process every cycle to ensure it never stays dead.
  while (BackgroundService.isRunning()) {
    // 1. Safety: Stop any existing/dead listeners
    try {
      stopStepCounterUpdate();
    } catch (e) {
      console.log(e);
    }

    // 2. Define the reading point (Year 2000 = Total Device Steps)
    const startPoint = new Date();
    startPoint.setFullYear(2000, 0, 1);

    // 3. Start the Sensor
    // We wrap this in a Promise so we can "wait" for a reading before sleeping
    await new Promise<void>(resolve => {
      let readingReceived = false;

      startStepCounterUpdate(startPoint, raw => {
        // If we already got a reading for this cycle, ignore extras
        if (readingReceived) return;
        readingReceived = true;

        const data = parseStepData(raw);
        const currentHardwareValue = data.steps;

        console.log(`[HEARTBEAT] Hardware Odometer: ${currentHardwareValue}`);

        // --- MATH LOGIC ---
        if (!isBaselineEstablished) {
          // First run ever
          saveLastHardwareValue(currentHardwareValue);
          previousHardwareValue = currentHardwareValue;
          isBaselineEstablished = true;
        } else {
          // Calculate Steps added since last loop
          let diff = currentHardwareValue - previousHardwareValue;

          // Reboot protection
          if (currentHardwareValue < previousHardwareValue) {
            diff = currentHardwareValue;
          }

          if (diff > 0) {
            const currentTotal = loadTodaySteps();
            const newTotal = currentTotal + diff;

            // Save everything
            saveTodaySteps(newTotal);
            saveLastHardwareValue(currentHardwareValue);
            previousHardwareValue = currentHardwareValue;

            // Update Notification
            BackgroundService.updateNotification({
              taskDesc: `Steps: ${newTotal}`,
            });

            console.log(`[STEP DETECTED] +${diff}. New Total: ${newTotal}`);
          }
        }

        // We got our data, we can resolve the promise now
        resolve();
      });

      // Fallback: If sensor doesn't reply in 1 second, move on (prevents hanging)
      setTimeout(() => {
        if (!readingReceived) resolve();
      }, 1000);
    });

    // 4. Sleep for the delay (e.g. 2 or 5 seconds) before checking again
    await sleep(delay);
  }

  stopStepCounterUpdate();
};

const options = {
  taskName: 'Step_Counter_Task',
  taskTitle: 'Step Counter Active',
  taskDesc: 'Tracking steps...',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'package://com.stepsensor',
  parameters: {
    delay: 2000,
  },
  // Essential for Android 14+
  type: 'dataSync',
};

// --- UI COMPONENT ---

export default function App() {
  const [steps, setSteps] = useState(0);
  const [isServiceRunning, setIsServiceRunning] = useState(false);

  const toggleService = async () => {
    const running = BackgroundService.isRunning();
    if (running) {
      await BackgroundService.stop();
      setIsServiceRunning(false);
    } else {
      // Just start normally. The library keeps it alive by default.
      await BackgroundService.start(veryIntensiveTask, options);
      setIsServiceRunning(true);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSteps(loadTodaySteps());
      setIsServiceRunning(BackgroundService.isRunning());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      await getStepPermission();
      const running = BackgroundService.isRunning();
      setIsServiceRunning(running);
      setSteps(loadTodaySteps());

      // Auto-start on launch if not running
      if (!running) {
        await BackgroundService.start(veryIntensiveTask, options);
        setIsServiceRunning(true);
      }
    };
    init();
  }, []);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <CircularProgress
          value={steps}
          maxValue={10000}
          radius={150}
          valueSuffix=" steps"
          subtitle={isServiceRunning ? 'Service: ON' : 'Service: OFF'}
        />

        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            {isServiceRunning ? 'Background Active' : 'Background Stopped'}
          </Text>
        </View>

        <View style={styles.row}>
          <Button
            title={isServiceRunning ? 'Stop Service' : 'Start Service'}
            onPress={toggleService}
            color={isServiceRunning ? 'red' : 'green'}
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <Button
            title="Reset Steps"
            onPress={async () => {
              if (BackgroundService.isRunning()) await BackgroundService.stop();
              saveTodaySteps(0);
              saveLastHardwareValue(0);
              setSteps(0);
              // Restart immediately
              await BackgroundService.start(veryIntensiveTask, options);
              setIsServiceRunning(true);
            }}
          />
        </View>

        <LogCat active={true} />
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
  statusBox: {
    marginVertical: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'space-between',
    width: '80%',
  },
});
