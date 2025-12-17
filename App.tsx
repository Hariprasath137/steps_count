'use client';

import {
  parseStepData,
  startStepCounterUpdate,
  stopStepCounterUpdate,
} from '@dongminyu/react-native-step-counter';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogCat from './src/LogCat';
import { getStepPermission } from './src/permission';
import {
  getLastSensorCount,
  loadTodaySteps,
  saveLastSensorCount,
  saveTodaySteps,
} from './src/storage';

// const getStartOfDay = () => {
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);
//   return now;
// };

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
    startStepCounterUpdate(new Date(), raw => {
      const d = parseStepData(raw);

      const previousSensorCount = getLastSensorCount();
      const existingSteps = loadTodaySteps();

      let delta = 0;

      if (d.steps >= previousSensorCount) {
        // normal case
        delta = d.steps - previousSensorCount;
      } else {
        // SENSOR RESET (phone reboot / app kill / driver restart)
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

    setActive(true);
  };

  const stop = () => {
    stopStepCounterUpdate();
    setActive(false);
  };

  useEffect(() => {
    const initialize = async () => {
      const granted = await getStepPermission();
      setAllowed(granted);

      if (granted) {
        loadPersistedSteps();
        start();
      }
    };

    initialize();

    return () => stopStepCounterUpdate();
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
