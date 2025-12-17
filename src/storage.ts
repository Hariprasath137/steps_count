import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

const STORAGE_KEYS = {
  CUMULATIVE_STEPS: 'cumulative_steps',
  LAST_SENSOR_COUNT: 'last_sensor_count',
  STEPS_DATE: 'steps_date',
};

// Get today's date as a string (YYYY-MM-DD)
const getTodayString = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split('T')[0];
};

// Load cumulative steps for today
export const loadTodaySteps = (): number => {
  const today = getTodayString();
  const savedDate = storage.getString(STORAGE_KEYS.STEPS_DATE);

  // If it's a new day, reset steps
  if (savedDate !== today) {
    storage.set(STORAGE_KEYS.CUMULATIVE_STEPS, 0);
    storage.set(STORAGE_KEYS.STEPS_DATE, today);

    storage.remove(STORAGE_KEYS.LAST_SENSOR_COUNT);
    return 0;
  }

  return storage.getNumber(STORAGE_KEYS.CUMULATIVE_STEPS) || 0;
};

// Save cumulative steps
export const saveTodaySteps = (steps: number) => {
  const today = getTodayString();
  storage.set(STORAGE_KEYS.CUMULATIVE_STEPS, steps);
  storage.set(STORAGE_KEYS.STEPS_DATE, today);
};

// Get the last sensor count (to calculate delta)
export const getLastSensorCount = (): number => {
  return storage.getNumber(STORAGE_KEYS.LAST_SENSOR_COUNT) || 0;
};

// Save the last sensor count
export const saveLastSensorCount = (count: number) => {
  storage.set(STORAGE_KEYS.LAST_SENSOR_COUNT, count);
};
