import { startStepCounterUpdate } from '@dongminyu/react-native-step-counter';
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
} from './src/backGround';
import { getStepPermission } from './src/permission';
import { loadTodaySteps } from './src/storage';

export default function App() {
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState(0);

  // 1. Read from Storage (UI updates from here)
  const refreshUI = () => {
    const current = loadTodaySteps();
    setSteps(current);
  };

  const start = async () => {
    if (Platform.OS === 'android') {
      // Start the Service. The Service handles the sensor.
      await startBackgroundService();
    } else {
      // iOS Fallback
      startStepCounterUpdate(new Date(), () => {});
    }
    setActive(true);
  };

  const stop = () => {
    if (Platform.OS === 'android') stopBackgroundService();
    setActive(false);
  };

  // 2. Poll storage every 2 seconds to update UI
  useEffect(() => {
    refreshUI();
    const interval = setInterval(refreshUI, 2000);
    return () => clearInterval(interval);
  }, []);

  // 3. Handle App Resume (Update UI immediately)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        refreshUI();
        // OPTIONAL: Re-trigger start to ensure service is alive
        if (Platform.OS === 'android') startBackgroundService();
      }
    });
    return () => subscription.remove();
  }, []);

  // 4. Initial Permissions & Auto-Start
  useEffect(() => {
    const initialize = async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        ]);
      }

      const granted = await getStepPermission();

      if (granted) {
        refreshUI();
        // Automatically start the service on app launch
        start();
      }
    };

    initialize();
  }, []);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <CircularProgress
          value={steps}
          maxValue={10000}
          radius={150}
          valueSuffix=" steps"
        />

        <View style={styles.row}>
          <Button title="Start" onPress={start} disabled={active} />
          <Button title="Stop" onPress={stop} disabled={!active} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#2f3774',
  },
  row: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-around',
    width: '80%',
  },
});
