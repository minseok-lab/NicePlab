// screens/CurrentLocationScreen.js

import { useEffect } from 'react';
import { Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

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
  const navigation = useNavigation();
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
    // WeatherInfo에 전달해야 할 값들
    finalRecommendedSlots,
    daylightInfo,
    genderFilter,
    setGenderFilter,
    levelFilter,
    setLevelFilter,
  } = useWeather();

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
        // ◀◀◀ useWeather에서 받은 모든 값을 WeatherInfo에 props로 전달합니다.
        <WeatherInfo
          weatherData={weatherData}
          liveData={liveData}
          plabMatches={plabMatches}
          plabLink={PLAB_FOOTBALL_URL}
          lastUpdateTime={lastUpdateTime}
          season={season}
          onRefresh={refetch}
          isRefreshing={isLoading}
          finalRecommendedSlots={finalRecommendedSlots}
          daylightInfo={daylightInfo}
          genderFilter={genderFilter}
          setGenderFilter={setGenderFilter}
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
        />
      ) : null}

      <Toast message={toastMessage} onDismiss={clearToast} />
    </LinearGradient>
  );
}
