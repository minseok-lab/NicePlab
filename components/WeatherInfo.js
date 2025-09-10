// components/WeatherInfo.js

// --- 1. Import Section ---
import { useState, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { fetchPlabMatchDetails } from '../apis';
import { useTheme } from '../contexts/ThemeContext';
import {
  getGlobalStyles,
  getRecommendTimeCardStyles,
  PALETTE,
} from '../styles';
import RecommendTimeCard from './RecommendTimeCard';
import MatchDetails from './MatchDetails';
import LiveWeatherCard from './LiveWeatherCard';
import LoadingIndicator from './LoadingIndicator';
import MatchFilter from './MatchFilter';

const styles = StyleSheet.create({
  headerContainer: {
    zIndex: 100,
  },
  cardWrapperVisible: {
    zIndex: 1,
  },
  cardWrapperHidden: {
    zIndex: -1,
  },
  emptyContainerVisible: {
    zIndex: 1,
  },
  emptyContainerHidden: {
    zIndex: -1,
  },
});

// --- Main Component ---
// 1. 필요한 모든 데이터를 props로 받도록 정의합니다.
const WeatherInfo = ({
  finalRecommendedSlots,
  liveData,
  daylightInfo,
  lastUpdateTime,
  onRefresh,
  isRefreshing,
  genderFilter,
  setGenderFilter,
  levelFilter,
  setLevelFilter,
  timezone,
}) => {
  // ▼ 2. 훅을 호출하여 현재 테마를 가져오고, 모든 동적 스타일을 생성합니다.
  const { state, location } = useTheme();
  const theme = PALETTE.themes[state];
  const globalStyles = getGlobalStyles(theme);

  const forcastCardStyles = getRecommendTimeCardStyles(theme);

  // --- State ---
  const [expandedTimestamp, setExpandedTimestamp] = useState(null);
  const [detailedMatches, setDetailedMatches] = useState({});
  const [loadingTimestamps, setLoadingTimestamps] = useState(new Set());

  // 드롭다운 zIndex 적용을 위해 열림 상태를 추적합니다.
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- [개선] Event Handlers ---
  const handleToggleCard = useCallback(
    async (timestamp, matchesToFetch) => {
      if (expandedTimestamp === timestamp) {
        setExpandedTimestamp(null);
        return;
      }
      setExpandedTimestamp(timestamp);

      // [로직 개선] 더 이상 plabMatches를 필터링할 필요 없이,
      // 클릭된 항목에 포함된 matchesToFetch를 바로 사용합니다.
      if (
        detailedMatches[timestamp] ||
        !matchesToFetch ||
        matchesToFetch.length === 0
      ) {
        return;
      }

      setLoadingTimestamps(prev => new Set(prev).add(timestamp));
      try {
        const detailPromises = matchesToFetch.map(match =>
          fetchPlabMatchDetails(match.id),
        );
        const results = await Promise.all(detailPromises);
        setDetailedMatches(prev => ({
          ...prev,
          [timestamp]: results.filter(Boolean),
        }));
      } catch (error) {
        console.error('Failed to fetch match details:', error);
      } finally {
        setLoadingTimestamps(prev => {
          const newSet = new Set(prev);
          newSet.delete(timestamp);
          return newSet;
        });
      }
    },
    [expandedTimestamp, detailedMatches],
  );

  // location을 기다리는 동안 로딩 화면을 보여줍니다.
  if (!location) {
    return <LoadingIndicator />;
  }

  // --- Render ---
  // ScrollView 대신 FlatList를 사용합니다.
  return (
    <FlatList
      // data prop에는 반복적으로 렌더링할 목록(추천 시간대)을 전달합니다.
      data={finalRecommendedSlots}
      // keyExtractor는 각 아이템의 고유 키를 지정합니다.
      keyExtractor={item => item.dt.toString()}
      // '당겨서 새로고침' 기능을 FlatList에 직접 연결합니다.
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      // ListHeaderComponent는 목록의 최상단에 한 번만 렌더링될 컴포넌트를 지정합니다.
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <LiveWeatherCard
            liveData={liveData}
            location={location}
            daylightInfo={daylightInfo}
            timezone={timezone}
          />
          <Text style={globalStyles.subHeader}>추천 시간대 TOP 10</Text>
          <MatchFilter
            genderFilter={genderFilter}
            onGenderChange={setGenderFilter}
            levelFilter={levelFilter}
            onLevelChange={setLevelFilter}
            theme={theme}
            onDropdownToggle={setIsDropdownOpen}
          />
        </View>
      }
      // renderItem은 data 배열의 각 아이템을 어떻게 렌더링할지 정의합니다.
      renderItem={({ item: weatherItem }) => {
        const { dt: timestamp, matches } = weatherItem;
        const isExpanded = expandedTimestamp === timestamp;
        const isLoading = loadingTimestamps.has(timestamp);
        const matchesForThisSlot = detailedMatches[timestamp] || matches;

        return (
          <TouchableOpacity
            onPress={() => handleToggleCard(timestamp, matches)}
            activeOpacity={0.8}
            // ✨ 추가: 드롭다운이 열렸을 때 날씨 카드의 zIndex를 낮춰 겹치지 않게 합니다.
            // ▼ 동적 스타일을 StyleSheet와 삼항 연산자로 적용합니다.
            style={
              isDropdownOpen
                ? styles.cardWrapperHidden
                : styles.cardWrapperVisible
            }
          >
            <View style={forcastCardStyles.cardContainer}>
              <RecommendTimeCard
                weatherItem={weatherItem}
                timezone={timezone}
              />
              {isExpanded && (
                <MatchDetails
                  isLoading={isLoading}
                  matches={matchesForThisSlot}
                  theme={theme}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      // ListEmptyComponent는 data 배열이 비어있을 때 표시될 UI를 정의합니다.
      ListEmptyComponent={
        // ✨ 변경점: 1. View로 감싸고 zIndex를 동적으로 적용합니다.
        <View
          style={
            isDropdownOpen
              ? styles.emptyContainerHidden
              : styles.emptyContainerVisible
          }
        >
          <Text style={globalStyles.noDataText}>
            ✅ 선택하신 조건에 맞는 추천 시간대가 없네요!
          </Text>
        </View>
      }
      // ListFooterComponent는 목록의 최하단에 한 번만 렌더링될 컴포넌트를 지정합니다.
      ListFooterComponent={
        <>
          <View style={globalStyles.footerContainer}>
            <Text style={globalStyles.footerText}>
              기상정보출처: 기상청, 에어코리아
            </Text>
            <Text style={globalStyles.footerText}>
              날씨 아이콘 : Google Weather API
            </Text>
            <Text style={globalStyles.footerText}>
              업데이트 {lastUpdateTime}
            </Text>
            <Text style={globalStyles.footerText}> </Text>
            <Text style={globalStyles.footerText}>
              플랩 매치 출처: 플랩풋볼
            </Text>
            <Text style={globalStyles.footerText}>
              Nice플랩은 플랩풋볼의 API를 활용한 비인가 서비스입니다.
            </Text>
            <Text style={globalStyles.footerText}> </Text>
          </View>
        </>
      }
      // FlatList 자체에 스타일을 적용할 수 있습니다.
      style={globalStyles.container}
      contentContainerStyle={globalStyles.scrollViewContent}
    />
  );
};

export default WeatherInfo;
