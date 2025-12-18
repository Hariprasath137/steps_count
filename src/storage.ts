import { createMMKV } from 'react-native-mmkv';
export const storage = createMMKV();

export const STORAGE_KEYS = {
  TODAY_STEPS: 'today_steps',
  LAST_SENSOR_COUNT: 'last_sensor_count',
  LAST_DATE: 'last_date',
};

const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

export const loadTodaySteps = (): number => {
  try {
    const storedDate = storage.getString(STORAGE_KEYS.LAST_DATE);
    const todayDate = getTodayDate();

    if (storedDate !== todayDate) {
      storage.set(STORAGE_KEYS.LAST_DATE, todayDate);
      storage.set(STORAGE_KEYS.TODAY_STEPS, 0);
      storage.set(STORAGE_KEYS.LAST_SENSOR_COUNT, 0);
      return 0;
    }

    const steps = storage.getNumber(STORAGE_KEYS.TODAY_STEPS);
    return steps ?? 0;
  } catch (error) {
    console.error('Error loading steps:', error);
    return 0;
  }
};

export const saveTodaySteps = (steps: number) => {
  try {
    storage.set(STORAGE_KEYS.TODAY_STEPS, steps);
    storage.set(STORAGE_KEYS.LAST_DATE, getTodayDate());
  } catch (error) {
    console.error('Error saving steps:', error);
  }
};

export const getLastSensorCount = (): number => {
  try {
    const count = storage.getNumber(STORAGE_KEYS.LAST_SENSOR_COUNT);
    return count ?? 0;
  } catch (error) {
    console.error('Error getting last sensor count:', error);
    return 0;
  }
};

export const saveLastSensorCount = (count: number) => {
  try {
    storage.set(STORAGE_KEYS.LAST_SENSOR_COUNT, count);
  } catch (error) {
    console.error('Error saving sensor count:', error);
  }
};
