import { useEffect, useRef, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const emitter = new NativeEventEmitter(NativeModules.StepCounter);

export default function LogCat({ active }: { active: boolean }) {
  const [logs, setLogs] = useState<string[]>([]);
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    if (!active) return;

    const events = ['StepCounter.stepDetected', 'StepCounter.errorOccurred'];
    const subs = events.map(name =>
      emitter.addListener(name, data => {
        setLogs(p => [...p, `${name}: ${JSON.stringify(data)}`]);
        ref.current?.scrollToEnd({ animated: false });
      }),
    );

    return () => subs.forEach(s => s.remove());
  }, [active]);

  return (
    <View style={styles.box}>
      <ScrollView ref={ref}>
        {logs.map((l, i) => (
          <Text key={i} style={styles.log}>
            {l}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 150,
    width: '100%',
    backgroundColor: '#111827',
    padding: 10,
    marginTop: 10,
  },
  log: { color: 'white', fontSize: 12 },
});
