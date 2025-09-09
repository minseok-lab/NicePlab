// screens/SearchScreen.js

import { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ✨ 1. 기존의 강력한 모듈들을 그대로 가져옵니다.
import { useWeather } from '../hooks/useWeather';
import { WeatherInfo } from '../components';
import { getUniqueLocations } from '../utils/searchLocationUtils'; // 검색용 유틸리티
import { useTheme } from '../contexts/ThemeContext';
import { getGlobalStyles, PALETTE } from '../styles';
import { getSearchScreenStyles } from '../styles/searchScreen.style';
import LoadingIndicator from '../components/LoadingIndicator';

/**
 * @description 선택된 지역의 날씨 결과를 보여주는 자식 컴포넌트입니다.
 * 이 컴포넌트는 locationName prop이 있을 때만 렌더링되며,
 * 렌더링되는 시점에 useWeather 훅을 호출하여 데이터 로딩을 시작합니다.
 */
const SearchResult = ({ locationName, onBack }) => {
  const { state, colors } = useTheme();
  const theme = PALETTE.themes[state];
  const globalStyles = getGlobalStyles(theme);
  const styles = getSearchScreenStyles(theme);

  // ✨ 2. useWeather 훅에 선택된 지역 이름을 전달하여 재사용합니다.
  const weatherHookData = useWeather(locationName);

  return (
    <LinearGradient colors={colors} style={{ flex: 1 }}>
      <SafeAreaView style={globalStyles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 다른 지역 검색하기</Text>
        </TouchableOpacity>

        {/* ✨ 3. WeatherInfo 컴포넌트에 useWeather 훅의 결과를 그대로 전달합니다.
        로딩, 에러, 데이터 표시 등 모든 UI/UX가 '내 위치' 화면과 동일해집니다.
      */}
        <WeatherInfo
          // useWeather가 반환하는 모든 props를 그대로 넘겨줍니다.
          finalRecommendedSlots={weatherHookData.finalRecommendedSlots}
          liveData={weatherHookData.liveData}
          daylightInfo={weatherHookData.daylightInfo}
          lastUpdateTime={weatherHookData.lastUpdateTime}
          onRefresh={weatherHookData.refetch}
          isRefreshing={weatherHookData.isLoading}
          genderFilter={weatherHookData.genderFilter}
          setGenderFilter={weatherHookData.setGenderFilter}
          levelFilter={weatherHookData.levelFilter}
          setLevelFilter={weatherHookData.setLevelFilter}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

/**
 * @description 지역 검색을 담당하는 메인 스크린 컴포넌트입니다.
 * 이 컴포넌트의 책임은 '검색 UI 제공'과 '지역 선택 상태 관리'입니다.
 */
export default function SearchScreen() {
  const { state } = useTheme();
  const theme = PALETTE.themes[state];
  const globalStyles = getGlobalStyles(theme);
  const styles = getSearchScreenStyles(theme);

  // --- 검색 관련 상태 ---
  const [searchQuery, setSearchQuery] = useState('');
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null); // 사용자가 선택한 지역

  useEffect(() => {
    // 최초 렌더링 시, 검색할 지역 목록을 불러옵니다.
    const locations = getUniqueLocations();
    setAllLocations(locations);
  }, []);

  const handleSearch = query => {
    setSearchQuery(query);
    if (query) {
      const filtered = allLocations.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]); // 검색어가 없으면 목록을 비웁니다.
    }
  };

  const handleSelectLocation = location => {
    setSelectedLocation(location.name); // 선택된 지역의 이름(string)을 상태에 저장
    setSearchQuery(''); // 검색창 초기화
    setFilteredLocations([]); // 목록 초기화
  };

  // ✨ 4. '선택된 지역'이 있다면 결과 컴포넌트를, 없다면 검색 UI를 보여줍니다.
  if (selectedLocation) {
    return (
      <SearchResult
        locationName={selectedLocation}
        onBack={() => setSelectedLocation(null)} // 뒤로가기 핸들러
      />
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* ✨ 3. 분리된 스타일 객체를 사용합니다. */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="지역 검색 (예: 서울특별시 강남구)"
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {allLocations.length === 0 ? (
          <LoadingIndicator />
        ) : (
          <FlatList
            data={filteredLocations}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectLocation(item)}>
                <Text style={styles.listItem}>{item.name}</Text>
              </TouchableOpacity>
            )}
            // 키보드가 열려도 목록이 잘 작동하도록 설정합니다.
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
