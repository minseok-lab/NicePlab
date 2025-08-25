// App.js

// --- 1. Import Section ---
// 1) React 및 React Native 핵심 라이브러리
import { useState, useCallback } from 'react'; 
import { View, Image, ScrollView, RefreshControl } from 'react-native';

// 2) 서드파티 라이브러리
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// 3) 내부 모듈 (Hooks, Constants, Components)
import { useWeather } from './hooks/useWeather.js';
import { PLAB_FOOTBALL_URL } from './constants';
import { WeatherInfo, LoadingIndicator, ErrorMessage, Toast } from './components';

// 4) 스타일
import { styles } from './styles/styles.js';

// 5) 에셋
import Logo from './assets/nicePlabLogo.png';


// --- 2. App 컴포넌트를 SafeArea를 사용하도록 수정 ---
function AppContent() {

  // 1) 시스템 UI(하단 바 등)에 의해 가려지는 영역의 크기를 가져옵니다.
  const insets = useSafeAreaInsets(); 
  const { weatherData, errorMsg, isLoading, plabMatches, lastUpdateTime, uvBaseDate, refetch, toastMessage, clearToast } = useWeather();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderContent = () => {
    // 2) 초기 로딩 시, 캐시된 데이터가 있으면 보여주고 아니면 로딩 인디케이터를 보여줍니다.
    if (isLoading && !weatherData) {
      return <LoadingIndicator />;
    }
    // 3) 전체 에러(예: 위치 권한)가 발생했을 때
    if (errorMsg) {
      return <ErrorMessage message={errorMsg} />;
    }
    // 4) 데이터가 있을 때 (캐시된 데이터 또는 새 데이터)
    if (weatherData) {
      return <WeatherInfo weatherData={weatherData} plabMatches={plabMatches} plabLink={PLAB_FOOTBALL_URL} lastUpdateTime={lastUpdateTime} uvBaseDate={uvBaseDate} />;
    }
    return null;
  };

  // --- 3. 화면에 보여줄 UI(사용자 인터페이스)를 렌더링하는 부분 ---
  return (
    // 1) View에 동적으로 paddingBottom을 적용하여 하단 바 영역을 확보합니다.
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Image 
        source={Logo} 
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* 2) ScrollView로 감싸서 화면이 작을 때도 스크롤 가능하도록 합니다. */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderContent()}
      </ScrollView>

      {/* 3) Toast 메시지 컴포넌트 */}
      <Toast message={toastMessage} onDismiss={clearToast} />
    </View>
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