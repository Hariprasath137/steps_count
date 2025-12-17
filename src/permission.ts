import { Platform } from 'react-native';
import {
  check,
  openSettings,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions';

const ANDROID_MOTION = PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION;
const IOS_MOTION = PERMISSIONS.IOS.MOTION;

export async function getStepPermission() {
  const perm = Platform.OS === 'ios' ? IOS_MOTION : ANDROID_MOTION;
  const result = await request(perm);
  if (result === RESULTS.GRANTED) return true;

  openSettings();
  const recheck = await check(perm);
  return recheck === RESULTS.GRANTED;
}
