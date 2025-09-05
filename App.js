// App.js

// --- 1. Import Section ---
// 1) React 및 React Native 핵심 라이브러리
import { Image, ScrollView, RefreshControl, StatusBar } from 'react-native';

// 2) 서드파티 라이브러리
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// 3) 내부 모듈 (Hooks, Constants, Components)
import { useWeather, useDynamicGradient } from './hooks'; // <<< 변경: 새로 만든 훅 추가
import { PLAB_FOOTBALL_URL } from './constants';
import {
  WeatherInfo,
  LoadingIndicator,
  ErrorMessage,
  Toast,
} from './components';

// 4) 스타일
import { getGlobalStyles, PALETTE } from './styles';

// 5) 로고 에셋
import LogoBlack from './assets/nicePlabLogoBlack.png';
import LogoWhite from './assets/nicePlabLogoWhite.png';

// --- 2. App 컴포넌트 ---
function AppContent() {
  // 1) 시스템 UI(하단 바 등)에 의해 가려지는 영역의 크기를 가져옵니다.
  const insets = useSafeAreaInsets();
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
  const { colors, statusBar, state } = useDynamicGradient();
  // ▼ 2. 훅으로 가져온 state를 기반으로 테마와 스타일을 동적으로 생성합니다.
  const theme = PALETTE.themes[state];
  const styles = getGlobalStyles(theme);
  // ▲
  const currentLogo = state === 'night' ? LogoWhite : LogoBlack;

  // ✨ 개선안 1: 'refreshing' 상태와 'onRefresh' 함수를 제거합니다.
  // isLoading과 refetch를 RefreshControl에서 직접 사용해 상태 관리를 통합합니다.

  // ✨ 개선안 2: 'renderContent' 헬퍼 함수를 제거하고 JSX 내부에 직접 조건부 렌더링을 구현합니다.

  // --- 3. 화면에 보여줄 UI(사용자 인터페이스)를 렌더링하는 부분 ---
  return (
    // 1) View에 동적으로 paddingBottom을 적용하여 하단 바 영역을 확보합니다.
    <LinearGradient
      colors={colors}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <StatusBar barStyle={statusBar} />
      <Image source={currentLogo} style={styles.logo} resizeMode="contain" />

      {/* 2) ScrollView로 감싸서 화면이 작을 때도 스크롤 가능하도록 합니다. */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        // ✨ 개선안 1 적용: refreshing prop에 isLoading을, onRefresh prop에 refetch 함수를 직접 전달합니다.
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* ✨ 개선안 2 적용: JSX 내부에서 직접 조건부 렌더링을 수행합니다. */}
        {isLoading && !weatherData && !liveData ? ( // [변경] 로딩 조건 구체화
          <LoadingIndicator />
        ) : errorMsg ? (
          <ErrorMessage message={errorMsg} />
        ) : weatherData ? (
          <WeatherInfo
            weatherData={weatherData}
            liveData={liveData} // [추가] liveData를 prop으로 전달
            plabMatches={plabMatches}
            plabLink={PLAB_FOOTBALL_URL}
            lastUpdateTime={lastUpdateTime}
            season={season}
          />
        ) : null}
      </ScrollView>

      {/* 3) Toast 메시지 컴포넌트 */}
      <Toast message={toastMessage} onDismiss={clearToast} />
    </LinearGradient>
  );
}

// --- 4. 전체 앱을 SafeAreaProvider로 감싸줍니다. ---
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
