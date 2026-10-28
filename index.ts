import 'react-native-gesture-handler';
import { createElement, type ComponentType } from 'react';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';

import { FEATURES } from './src/constants/features';
import { isAndroidWidgetAvailable } from './src/utils/nativeAvailability';

function AppEntry() {
  const App = require('./App').default as ComponentType;
  return createElement(App);
}

registerRootComponent(AppEntry);

if (FEATURES.widgets && Platform.OS === 'android' && isAndroidWidgetAvailable()) {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
