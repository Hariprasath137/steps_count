'use client';

import {
  parseStepData,
  startStepCounterUpdate,
} from '@dongminyu/react-native-step-counter';
import { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ensureStepListener,
  startBackgroundService,
} from './src/backgroundService';
import LogCat from './src/LogCat';
import { getStepPermission } from './src/permission';
import { loadTodaySteps } from './src/storage';

export default function App() {
  const [allowed, setAllowed] = useState(false);
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState('0 kCal');

  const loadPersistedSteps = () => {
    const todaySteps = loadTodaySteps();
    setSteps(todaySteps);
    const cals = Math.floor(todaySteps * 0.04);
    setCalories(cals + ' kCal');
    console.log('Loaded persisted steps:', todaySteps);
  };

  const startService = () => {
    if (Platform.OS === 'android') {
      startBackgroundService();
    } else {
      // iOS - use regular step counter
      startStepCounterUpdate(new Date(), raw => {
        const d = parseStepData(raw);
        console.log(d);
      });
    }
  };

  // Update UI when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground');
        loadPersistedSteps();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Periodically update steps from storage
  useEffect(() => {
    const interval = setInterval(() => {
      loadPersistedSteps();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Initialize on mount - auto-start
  useEffect(() => {
    const initialize = async () => {
      const granted = await getStepPermission();
      console.log('Step permission result:', granted);
      setAllowed(granted);

      if (!granted) return;

      // 1️⃣ Start sensor listener ONCE for app lifetime
      setTimeout(() => {
        ensureStepListener();
        if (Platform.OS === 'android') {
          startBackgroundService();
        }
        loadPersistedSteps();
      }, 300);

      // 2️⃣ Start foreground service (Android only)
      if (Platform.OS === 'android') {
        startBackgroundService();
      }

      // 3️⃣ Load UI state
      loadPersistedSteps();
    };

    initialize();

    return () => {
      console.log('App unmounting - service continues in background');
    };
  }, []);

  console.log('Permission allowed:', allowed);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <CircularProgress
          value={steps}
          maxValue={10000}
          radius={150}
          valueSuffix=" steps"
          subtitle={calories}
        />

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
});
