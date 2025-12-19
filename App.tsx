import {
  parseStepData,
  startStepCounterUpdate,
  stopStepCounterUpdate,
} from '@dongminyu/react-native-step-counter';
import { useEffect, useState } from 'react';
import {
  AppState,
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  startBackgroundService,
  stopBackgroundService,
  updateNotificationSteps,
} from './src/backGround';
import LogCat from './src/LogCat';
import { getStepPermission } from './src/permission';
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

  const loadPersistedSteps = () => {
    const todaySteps = loadTodaySteps();
    setSteps(todaySteps);
    console.log('Loaded persisted steps:', todaySteps);
  };

  const start = () => {
    if (Platform.OS === 'android') {
      // Start background service
      startBackgroundService();
    } else {
      // iOS - use regular step counter
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

        const totalSteps = existingSteps + delta;

        console.log('Sensor:', d.steps);
        console.log('Prev sensor:', previousSensorCount);
        console.log('Delta:', delta);
        console.log('Total:', totalSteps);

        setSteps(totalSteps);
        setInfo(d);

        saveTodaySteps(totalSteps);
        saveLastSensorCount(d.steps);
      });
    }

    setActive(true);
  };

  const stop = () => {
    if (Platform.OS === 'android') {
      stopBackgroundService();
    } else {
      stopStepCounterUpdate();
    }
    setActive(false);
  };

  // Update UI when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // Reload steps when app comes to foreground
        loadPersistedSteps();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Periodically update steps from storage when in foreground
  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      const currentSteps = loadTodaySteps();
      setSteps(currentSteps);

      // Update notification if on Android
      if (Platform.OS === 'android') {
        try {
          updateNotificationSteps(currentSteps, info.calories);
        } catch (error) {
          console.log('Notification update failed:', error);
        }
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [active, info.calories]);

  useEffect(() => {
    const initialize = async () => {
      // 1. Request Notification Permission (Android 13+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      // 2. Get Step Permission
      const granted = await getStepPermission();
      setAllowed(granted);

      if (granted) {
        loadPersistedSteps();
        start();
      }
    };

    initialize();

    return () => {
      //   if (Platform.OS === 'android') {
      //     // Don't stop the service on unmount - let it run in background
      //   } else {
      //     stopStepCounterUpdate();
      //   }
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
          subtitle={info.calories === '0 kCal' ? '' : info.calories}
        />

        <View style={styles.row}>
          <Button title="Start" onPress={start} disabled={active} />
          <Button title="Stop" onPress={stop} disabled={!active} />
        </View>

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
  row: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'space-between',
    width: '80%',
  },
});
