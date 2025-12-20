import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

const STORAGE_KEYS = {
  CUMULATIVE_STEPS: 'cumulative_steps', // Steps shown to user
  LAST_HARDWARE_VAL: 'last_hardware_val', // Raw sensor number
  STEPS_DATE: 'steps_date',
};

const getTodayString = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split('T')[0];
};

export const loadTodaySteps = (): number => {
  const today = getTodayString();
  const savedDate = storage.getString(STORAGE_KEYS.STEPS_DATE);

  if (savedDate !== today) {
    storage.set(STORAGE_KEYS.CUMULATIVE_STEPS, 0);
    storage.set(STORAGE_KEYS.STEPS_DATE, today);
    // Don't reset hardware val here, only cumulative
    return 0;
  }

  return storage.getNumber(STORAGE_KEYS.CUMULATIVE_STEPS) || 0;
};

export const saveTodaySteps = (steps: number) => {
  const today = getTodayString();
  storage.set(STORAGE_KEYS.CUMULATIVE_STEPS, steps);
  storage.set(STORAGE_KEYS.STEPS_DATE, today);
};

// --- NEW FUNCTIONS FOR HARDWARE PERSISTENCE ---

export const saveLastHardwareValue = (val: number) => {
  storage.set(STORAGE_KEYS.LAST_HARDWARE_VAL, val);
};

export const loadLastHardwareValue = (): number => {
  return storage.getNumber(STORAGE_KEYS.LAST_HARDWARE_VAL) || 0;
};
