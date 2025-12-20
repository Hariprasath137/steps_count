import { Platform } from 'react-native';
import {
  openSettings,
  PERMISSIONS,
  request,
  requestMultiple,
  RESULTS,
} from 'react-native-permissions';

export async function getStepPermission() {
  if (Platform.OS === 'ios') {
    const result = await request(PERMISSIONS.IOS.MOTION);
    return result === RESULTS.GRANTED;
  }

  // FIX: Hardcode the string and cast to 'any' to fix the TS error
  const ANDROID_POST_NOTIFICATIONS =
    'android.permission.POST_NOTIFICATIONS' as any;

  const permissionsToRequest = [
    PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
    ANDROID_POST_NOTIFICATIONS,
  ];

  // Cast the array to 'any' so requestMultiple doesn't complain about the custom string
  const results = await requestMultiple(permissionsToRequest as any);

  const activityStatus = results[PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION];
  const notificationStatus = results[ANDROID_POST_NOTIFICATIONS];

  // Check if Activity Recognition is granted
  if (activityStatus === RESULTS.GRANTED) {
    return true;
  }

  // If denied (and not just "unavailable"), open settings
  if (activityStatus === RESULTS.BLOCKED || activityStatus === RESULTS.DENIED) {
    openSettings();
    return false;
  }

  return false;
}
