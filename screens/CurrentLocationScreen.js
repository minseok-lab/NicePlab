// screens/CurrentLocationScreen.js

import { Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// 내부 모듈 및 스타일
import { useWeather } from '../hooks/useWeather';
import { useTheme } from '../contexts/ThemeContext';
import { PLAB_FOOTBALL_URL } from '../constants';
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
  const {
    weatherData,
    liveData,
    errorMsg,
    isLoading,
    plabMatches,
    lastUpdateTime,
    season,
    refetch,
    toastMessage,
    clearToast,
  } = useWeather();

  // ThemeProvider를 통해 전달된 테마 데이터를 가져옵니다.
  const themeData = useTheme();

  // 테마 데이터가 아직 로딩 중이면(초기 상태) 아무것도 표시하지 않습니다.
  if (!themeData) {
    return null;
  }

  const { colors, statusBar, state } = themeData;
  const theme = PALETTE.themes[state];
  const styles = getGlobalStyles(theme);
  const currentLogo = state === 'night' ? LogoWhite : LogoBlack;

  return (
    <LinearGradient colors={colors} style={styles.container}>
      <StatusBar barStyle={statusBar} />
      <Image source={currentLogo} style={styles.logo} />

      {isLoading && !weatherData && !liveData ? (
        <LoadingIndicator />
      ) : errorMsg ? (
        <ErrorMessage message={errorMsg} />
      ) : weatherData ? (
        <WeatherInfo
          weatherData={weatherData}
          liveData={liveData}
          plabMatches={plabMatches}
          plabLink={PLAB_FOOTBALL_URL}
          lastUpdateTime={lastUpdateTime}
          season={season}
          onRefresh={refetch}
          isRefreshing={isLoading}
        />
      ) : null}

      <Toast message={toastMessage} onDismiss={clearToast} />
    </LinearGradient>
  );
}
