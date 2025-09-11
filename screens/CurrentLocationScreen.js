// screens/CurrentLocationScreen.js

import { useEffect } from 'react';
import { Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// 내부 모듈 및 스타일
import { useWeather } from '../hooks/useWeather';
import { useTheme } from '../contexts/ThemeContext';
import {
  WeatherInfo,
  LoadingIndicator,
  ErrorMessage,
  Toast,
} from '../components';
import { getGlobalStyles, PALETTE } from '../styles';

// 로고 에셋
import LogoBlack from '../assets/nicePlabLogoBlack.png';
import LogoWhite from '../assets/nicePlabLogoWhite.png';

export default function CurrentLocationScreen() {
  const navigation = useNavigation();
  // useWeather 훅의 반환값을 하나의 객체로 받아 코드를 단순화합니다.
  const weatherHookData = useWeather();

  // ✨ 2. weatherHookData 객체에서 컴포넌트 스코프에서 직접 필요한 변수들만 구조 분해합니다.
  const { refetch, toastMessage, clearToast } = weatherHookData;

  // ThemeProvider를 통해 전달된 테마 데이터를 가져옵니다.
  const themeData = useTheme();

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      // 탭이 이미 포커스된 상태(현재 화면)에서 다시 눌렸는지 확인합니다.
      if (navigation.isFocused()) {
        console.log('내 위치 탭 재클릭: 데이터 새로고침을 시작합니다.');
        refetch(); // useWeather 훅의 refetch 함수 호출
      }
    });

    // 화면이 사라질 때 리스너를 정리합니다. (메모리 누수 방지)
    return unsubscribe;
  }, [navigation, refetch]);

  // 테마 데이터가 아직 로딩 중이면(초기 상태) 아무것도 표시하지 않습니다.
  if (!themeData) {
    return <LoadingIndicator />;
  }

  const { colors, statusBar, state, daylightInfo } = themeData;
  const theme = PALETTE.themes[state];
  const styles = getGlobalStyles(theme);
  const currentLogo = state === 'night' ? LogoWhite : LogoBlack;

  return (
    <LinearGradient colors={colors} style={styles.container}>
      <StatusBar barStyle={statusBar} />
      <Image source={currentLogo} style={styles.logo} />

      {weatherHookData.isLoading &&
      !weatherHookData.weatherData &&
      !weatherHookData.liveData ? (
        <LoadingIndicator />
      ) : weatherHookData.errorMsg ? (
        <ErrorMessage message={weatherHookData.errorMsg} />
      ) : weatherHookData.weatherData ? (
        // ✨ 4. WeatherInfo에 weatherHookData의 모든 속성을 한번에 전달하고,
        //    이름이 다른 prop과 다른 훅에서 온 prop을 추가로 전달합니다.
        <WeatherInfo
          {...weatherHookData}
          onRefresh={weatherHookData.refetch}
          isRefreshing={weatherHookData.isLoading}
          daylightInfo={daylightInfo}
        />
      ) : null}

      <Toast message={toastMessage} onDismiss={clearToast} />
    </LinearGradient>
  );
}
