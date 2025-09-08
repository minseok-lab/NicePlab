// components/WeatherInfo.js

// --- 1. Import Section ---
import { useState, useMemo, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  Button,
  Linking,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { fetchPlabMatchDetails } from '../api';
import { getBestExerciseTimes } from '../utils';
import { useDynamicGradient } from '../hooks';
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
const WeatherInfo = ({
  weatherData,
  liveData,
  plabMatches = [],
  plabLink,
  lastUpdateTime,
  season,
  daylightInfo,
  onRefresh,
  isRefreshing,
}) => {
  // ▼ 2. 훅을 호출하여 현재 테마를 가져오고, 모든 동적 스타일을 생성합니다.
  const { state, location } = useDynamicGradient();
  const theme = PALETTE.themes[state];
  const globalStyles = getGlobalStyles(theme);
  const forcastCardStyles = getRecommendTimeCardStyles(theme);

  // --- State ---
  const [expandedTimestamp, setExpandedTimestamp] = useState(null);
  const [detailedMatches, setDetailedMatches] = useState({});
  const [loadingTimestamps, setLoadingTimestamps] = useState(new Set());
  // 필터 상태를 관리하기 위한 useState 훅을 추가합니다.
  const [genderFilter, setGenderFilter] = useState([]); // 'all', 'male', 'female', 'mixed'
  const [levelFilter, setLevelFilter] = useState([]); // 'all', 'amateur2_under', 'amateur4_above', 'general'

  // 드롭다운 zIndex 적용을 위해 열림 상태를 추적합니다.
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Memoized Data Processing ---
  const finalRecommendedSlots = useMemo(() => {
    // 1. 데이터가 준비되지 않았다면 즉시 빈 배열 반환
    if (!weatherData?.list || !season || !plabMatches) {
      return [];
    }

    // ✨ 3. Plab 매치 목록을 그룹화하기 전에, 현재 필터 조건에 따라 먼저 필터링합니다.
    const filteredPlabMatches = plabMatches.filter(match => {
      // ✨ 변경점: 2. 필터링 로직을 "배열이 비어있거나, 선택된 값을 포함하는지"로 수정합니다.
      const genderMatch =
        genderFilter.length === 0 || // 선택된 것이 없으면 모두 통과
        (genderFilter.includes('male') && match.sex === 1) ||
        (genderFilter.includes('female') && match.sex === -1) ||
        (genderFilter.includes('mixed') && match.sex === 0);

      const levelMatch =
        levelFilter.length === 0 ||
        (levelFilter.includes('amateur2_under') &&
          match.display_level === '아마추어2 이하') ||
        (levelFilter.includes('amateur4_above') &&
          match.display_level === '아마추어4 이상') ||
        (levelFilter.includes('general') && match.display_level === '누구나');

      return genderMatch && levelMatch;
    });

    // 필터링된 매치 목록을 사용하여 시간대별 Map을 생성합니다.
    // plabMatches를 시간대별로 조회할 수 있는 Map으로 변환합니다.
    // 이렇게 하면 매번 전체 배열을 순회할 필요가 없습니다.
    const matchesByHour = new Map();
    filteredPlabMatches.forEach(match => {
      const matchDate = new Date(match.schedule);
      // 'YYYY-MM-DDTHH:00:00.000Z' 형태로 시간 키를 정규화합니다.
      const hourKey = new Date(
        matchDate.getFullYear(),
        matchDate.getMonth(),
        matchDate.getDate(),
        matchDate.getHours(),
      ).toISOString();
      if (!matchesByHour.has(hourKey)) {
        matchesByHour.set(hourKey, []);
      }
      matchesByHour.get(hourKey).push(match);
    });

    // 3. 날씨 점수 기반 상위 후보 선정
    const bestWeatherCandidates = getBestExerciseTimes(
      weatherData.list,
      season,
    ).slice(0, 72); // 최대 72시간치 후보

    const filteredWithMatches = [];

    // 4. 날씨 좋은 시간대 후보를 순회합니다.
    for (const weatherItem of bestWeatherCandidates) {
      const slotStartTime = new Date(weatherItem.dt * 1000);
      const hourKey = slotStartTime.toISOString();

      // 5. [최적화] Map에서 O(1) 시간 복잡도로 해당 시간대의 매치를 즉시 조회합니다.
      if (matchesByHour.has(hourKey)) {
        // 6. [로직 개선] 매치가 있다면, 날씨 정보에 매치 목록을 포함시켜 최종 목록에 추가합니다.
        filteredWithMatches.push({
          ...weatherItem,
          matches: matchesByHour.get(hourKey), // 매치 목록을 여기에 포함
        });
      }

      // 7. 최종 목록이 10개가 채워지면 종료
      if (filteredWithMatches.length === 10) {
        break;
      }
    }

    return filteredWithMatches;
  }, [weatherData, season, plabMatches, genderFilter, levelFilter]);

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
                location={location}
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
          {/* 하단 버튼 및 푸터 */}
          <View style={globalStyles.buttonContainer}>
            <Button
              title="플랩에서 더 많은 매치 찾기"
              onPress={() => Linking.openURL(plabLink)}
            />
          </View>

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
