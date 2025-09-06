// components/WeatherInfo.js

// --- 1. Import Section ---
import { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  Button,
  Linking,
  TouchableOpacity,
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

// --- Main Component ---
const WeatherInfo = ({
  weatherData,
  liveData,
  plabMatches = [],
  plabLink,
  lastUpdateTime,
  season,
  daylightInfo,
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
  // ✨ 2. 필터 상태를 관리하기 위한 useState 훅을 추가합니다.
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'male', 'female', 'mixed'
  const [levelFilter, setLevelFilter] = useState('all'); // 'all', 'amateur2_under', 'amateur4_above', 'general'

  // --- Memoized Data Processing ---
  const finalRecommendedSlots = useMemo(() => {
    // 1. 데이터가 준비되지 않았다면 즉시 빈 배열 반환
    if (!weatherData?.list || !season || !plabMatches) {
      return [];
    }

    // ✨ 3. Plab 매치 목록을 그룹화하기 전에, 현재 필터 조건에 따라 먼저 필터링합니다.
    const filteredPlabMatches = plabMatches.filter(match => {
      const genderMatch =
        genderFilter === 'all' ||
        (genderFilter === 'male' && match.sex === 1) ||
        (genderFilter === 'female' && match.sex === -1) ||
        (genderFilter === 'mixed' && match.sex === 0);

      const levelMatch =
        levelFilter === 'all' ||
        (levelFilter === 'amateur2_under' &&
          match.display_level === '아마추어2 이하') ||
        (levelFilter === 'amateur4_above' &&
          match.display_level === '아마추어4 이상') ||
        (levelFilter === 'general' && match.display_level === '누구나');

      return genderMatch && levelMatch;
    });

    // 필터링된 매치 목록을 사용하여 시간대별 Map을 생성합니다.
    // plabMatches를 시간대별로 조회할 수 있는 Map으로 변환합니다.
    // 이렇게 하면 매번 전체 배열을 순회할 필요가 없습니다.
    const matchesByHour = new Map();
    plabMatches.forEach(match => {
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
    ).slice(0, 50);

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
  return (
    <ScrollView>
      <LiveWeatherCard
        liveData={liveData}
        location={location}
        daylightInfo={daylightInfo}
      />
      <Text style={globalStyles.subHeader}>추천 시간대 TOP 10</Text>

      {/* MatchFilter 컴포넌트를 렌더링하고, 상태와 핸들러를 props로 전달합니다. */}
      <MatchFilter
        genderFilter={genderFilter}
        onGenderChange={setGenderFilter}
        levelFilter={levelFilter}
        onLevelChange={setLevelFilter}
        theme={theme}
      />

      {finalRecommendedSlots.length > 0 ? (
        finalRecommendedSlots.map(weatherItem => {
          // 💡 [오류 수정] 이제 weatherItem에서 matches를 정상적으로 가져올 수 있습니다.
          const { dt: timestamp, matches } = weatherItem;
          const isExpanded = expandedTimestamp === timestamp;
          const isLoading = loadingTimestamps.has(timestamp);

          // 💡 [로직 개선] 상세 정보가 로딩되기 전에는 weatherItem에 포함된 기본 매치 정보를 사용합니다.
          const matchesForThisSlot = detailedMatches[timestamp] || matches;

          return (
            // 1. TouchableOpacity는 터치 이벤트만 담당하고 스타일은 가지지 않습니다.
            <TouchableOpacity
              key={timestamp}
              onPress={() => handleToggleCard(timestamp, matches)}
              activeOpacity={0.8}
            >
              {/* 2. 시각적인 스타일(배경, 그림자 등)은 내부의 View가 담당합니다. */}
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
        })
      ) : (
        <Text style={globalStyles.noDataText}>
          ✅ 선택하신 조건에 맞는 추천 시간대가 없네요!
        </Text>
      )}

      {/* 하단 버튼 및 푸터 (변경 없음) */}
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
        <Text style={globalStyles.footerText}>업데이트 {lastUpdateTime}</Text>
        <Text style={globalStyles.footerText}> </Text>
        <Text style={globalStyles.footerText}>플랩 매치 출처: 플랩풋볼</Text>
        <Text style={globalStyles.footerText}>
          Nice플랩은 플랩풋볼의 API를 활용한 비인가 서비스입니다.
        </Text>
        <Text style={globalStyles.footerText}> </Text>
      </View>
    </ScrollView>
  );
};

export default WeatherInfo;
