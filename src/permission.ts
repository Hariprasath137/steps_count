import { PermissionsAndroid, Platform } from 'react-native';

export async function getStepPermission() {
  if (Platform.OS !== 'android') return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;

  //  else {
  //     const result = await request(PERMISSIONS.IOS.MOTION);
  //     if (result === RESULTS.GRANTED) return true;

  //     openSettings();
  //     const recheck = await check(PERMISSIONS.IOS.MOTION);
  //     return recheck === RESULTS.GRANTED;
  //   }
}
