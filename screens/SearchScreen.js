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
import { useNavigation } from '@react-navigation/native';

// ✨ 1. 기존의 강력한 모듈들을 그대로 가져옵니다.
import { fetchAllSearchableLocations } from '../providers/locationProvider'; // 검색용 유틸리티
import { useLocation } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';
import { getGlobalStyles, PALETTE } from '../styles';
import { getSearchScreenStyles } from '../styles/searchScreen.style';
import LoadingIndicator from '../components/LoadingIndicator';

/**
 * @description 지역 검색을 담당하는 메인 스크린 컴포넌트입니다.
 * 이 컴포넌트의 책임은 '검색 UI 제공'과 '지역 선택 상태 관리'입니다.
 */
export default function SearchScreen() {
  const navigation = useNavigation(); // ✨ 4. 내비게이션 객체 생성
  const { setLocationName } = useLocation(); // ✨ 위치 변경 함수를 가져옴
  const { colors, state } = useTheme(); // ✨ 5. 배경 그라데이션을 위해 colors 가져오기
  const theme = PALETTE.themes[state];
  const globalStyles = getGlobalStyles(theme);
  const styles = getSearchScreenStyles(theme);

  // --- 검색 관련 상태 ---
  const [searchQuery, setSearchQuery] = useState('');
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);

  useEffect(() => {
    // 최초 렌더링 시, 검색할 지역 목록을 불러옵니다.
    const locations = fetchAllSearchableLocations();
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
    // 검색 후 다른 화면으로 이동하거나, 현재 화면의 UI를 조건부로 변경할 수 있습니다.
    // ✨ 6. 핵심 로직: 전역 위치를 변경하고, 결과 화면(CurrentLocationScreen)으로 이동합니다.
    setLocationName(location.name); // ✨ 중앙 상태를 업데이트하라고 명령
    navigation.navigate('CurrentLocation');
  };

  return (
    // ✨ 8. 배경 그라데이션을 위해 LinearGradient 추가
    <LinearGradient colors={colors} style={{ flex: 1 }}>
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
    </LinearGradient>
  );
}
