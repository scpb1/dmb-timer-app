import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

export function isViewShotAvailable(): boolean {
  return NativeModules.RNViewShot != null;
}

export function isAndroidWidgetAvailable(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (NativeModules.AndroidWidget) {
    return true;
  }

  try {
    return TurboModuleRegistry.get('AndroidWidget') != null;
  } catch {
    return false;
  }
}

export function isMediaLibraryAvailable(): boolean {
  return requireOptionalNativeModule('ExpoMediaLibrary') != null;
}

export function isPrintAvailable(): boolean {
  return requireOptionalNativeModule('ExpoPrint') != null;
}

export function isHolidayNotificationsAvailable(): boolean {
  const hasCore =
    requireOptionalNativeModule('ExpoNotificationsHandlerModule') != null &&
    requireOptionalNativeModule('ExpoNotificationScheduler') != null &&
    requireOptionalNativeModule('ExpoNotificationPermissionsModule') != null;

  if (!hasCore) {
    return false;
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  return requireOptionalNativeModule('ExpoNotificationChannelManager') != null;
}
