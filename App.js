// App.js

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LocationProvider } from './contexts/LocationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import BottomTabNavigator from './components/BottomTabNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* 1. LocationProvider가 ThemeProvider를 포함한 앱 전체를 감쌉니다. */}
      <LocationProvider>
        <ThemeProvider>
          <NavigationContainer>
            <BottomTabNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </LocationProvider>
      {/* 2. 중복되었던 하단의 LocationProvider는 제거합니다. */}
    </SafeAreaProvider>
  );
}
