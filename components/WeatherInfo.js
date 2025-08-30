// components/WeatherInfo.js

// --- 1. Import Section (변경 없음) ---
import { useState, useMemo } from 'react';
import { ScrollView, View, Text, Button, Linking, TouchableOpacity } from 'react-native';
import { fetchPlabMatchDetails } from '../api/plabApi';
import { getBestExerciseTimes } from '../utils';
import { globalStyles, forcastCardStyles } from '../styles';
import WeatherCard from './WeatherCard';
import MatchDetails from './MatchDetails';
import LiveWeatherCard from './LiveWeatherCard';

// --- Main Component ---
const WeatherInfo = ({ weatherData, liveData, plabMatches = [], plabLink, lastUpdateTime, season }) => {

  // --- State (변경 없음) ---
  const [expandedTimestamp, setExpandedTimestamp] = useState(null);
  const [detailedMatches, setDetailedMatches] = useState({});
  const [loadingTimestamps, setLoadingTimestamps] = useState(new Set());

  // --- 💡 [개선] Memoized Data Processing ---
  const finalRecommendedSlots = useMemo(() => {
    // 1. 데이터가 준비되지 않았다면 즉시 빈 배열 반환 (변경 없음)
    if (!weatherData?.list || !season || !plabMatches) {
      return [];
    }

    // 💡 2. [최적화] plabMatches를 시간대별로 조회할 수 있는 Map으로 변환합니다.
    // 이렇게 하면 매번 전체 배열을 순회할 필요가 없습니다.
    const matchesByHour = new Map();
    plabMatches.forEach(match => {
      const matchDate = new Date(match.schedule);
      // 'YYYY-MM-DDTHH:00:00.000Z' 형태로 시간 키를 정규화합니다.
      const hourKey = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate(), matchDate.getHours()).toISOString();
      if (!matchesByHour.has(hourKey)) {
        matchesByHour.set(hourKey, []);
      }
      matchesByHour.get(hourKey).push(match);
    });

    // 3. 날씨 점수 기반 상위 후보 선정 (변경 없음)
    const bestWeatherCandidates = getBestExerciseTimes(weatherData.list, season).slice(0, 25);

    const filteredWithMatches = [];

    // 4. 날씨 좋은 시간대 후보를 순회합니다.
    for (const weatherItem of bestWeatherCandidates) {
      const slotStartTime = new Date(weatherItem.dt * 1000);
      const hourKey = slotStartTime.toISOString();

      // 💡 5. [최적화] Map에서 O(1) 시간 복잡도로 해당 시간대의 매치를 즉시 조회합니다.
      if (matchesByHour.has(hourKey)) {
        // 💡 6. [로직 개선] 매치가 있다면, 날씨 정보에 매치 목록을 포함시켜 최종 목록에 추가합니다.
        filteredWithMatches.push({
          ...weatherItem,
          matches: matchesByHour.get(hourKey), // 매치 목록을 여기에 포함!
        });
      }
      
      // 7. 최종 목록이 7개가 채워지면 종료 (변경 없음)
      if (filteredWithMatches.length === 7) {
        break;
      }
    }

    return filteredWithMatches;
  }, [weatherData, season, plabMatches]);


  // --- 💡 [개선] Event Handlers ---
  const handleToggleCard = async (timestamp, matchesToFetch) => {
    if (expandedTimestamp === timestamp) {
      setExpandedTimestamp(null);
      return;
    }
    setExpandedTimestamp(timestamp);
    
    // 💡 [로직 개선] 더 이상 plabMatches를 필터링할 필요 없이,
    // 클릭된 항목에 포함된 matchesToFetch를 바로 사용합니다.
    if (detailedMatches[timestamp] || !matchesToFetch || matchesToFetch.length === 0) {
      return;
    }

    setLoadingTimestamps(prev => new Set(prev).add(timestamp));
    try {
      const detailPromises = matchesToFetch.map(match => fetchPlabMatchDetails(match.id));
      const results = await Promise.all(detailPromises);
      setDetailedMatches(prev => ({ ...prev, [timestamp]: results.filter(Boolean) }));
    } catch (error) {
      console.error("Failed to fetch match details:", error);
    } finally {
      setLoadingTimestamps(prev => {
        const newSet = new Set(prev);
        newSet.delete(timestamp);
        return newSet;
      });
    }
  };

  // --- Render ---
  return (
    <ScrollView>
      <LiveWeatherCard liveData={liveData} />
      <Text style={globalStyles.subHeader}>추천 시간대 TOP 7</Text>
      
      {finalRecommendedSlots.length > 0 ? (
        finalRecommendedSlots.map((weatherItem) => {
          // 💡 [오류 수정] 이제 weatherItem에서 matches를 정상적으로 가져올 수 있습니다.
          const { dt: timestamp, matches } = weatherItem;
          const isExpanded = expandedTimestamp === timestamp;
          const isLoading = loadingTimestamps.has(timestamp);
          
          // 💡 [로직 개선] 상세 정보가 로딩되기 전에는 weatherItem에 포함된 기본 매치 정보를 사용합니다.
          const matchesForThisSlot = detailedMatches[timestamp] || matches;

          return (
            <TouchableOpacity 
              key={timestamp} 
              style={forcastCardStyles.cardContainer}
              // 💡 [로직 개선] 핸들러에 클릭된 카드의 기본 매치 정보를 함께 넘겨줍니다.
              onPress={() => handleToggleCard(timestamp, matches)}
              activeOpacity={0.8}
            >
              <WeatherCard weatherItem={weatherItem} />
              {isExpanded && (
                <MatchDetails 
                  isLoading={isLoading}
                  matches={matchesForThisSlot}
                />
              )}
            </TouchableOpacity>
          );
        })
      ) : (
        <Text style={globalStyles.noDataText}>추천할 만한 시간대가 없네요.</Text>
      )}

      {/* 하단 버튼 및 푸터 (변경 없음) */}
      <View style={globalStyles.buttonContainer}>
        <Button 
          title="플랩에서 더 많은 매치 찾기" 
          onPress={() => Linking.openURL(plabLink)}
        />
      </View>
      <View style={globalStyles.footerContainer}>
        <Text style={globalStyles.footerText}>기상정보출처: 기상청, 에어코리아</Text>
        <Text style={globalStyles.footerText}>날씨 아이콘 : Google Weather API</Text>
        <Text style={globalStyles.footerText}>업데이트 {lastUpdateTime}</Text>
        <Text style={globalStyles.footerText}> </Text>
        <Text style={globalStyles.footerText}>플랩 매치 출처: 플랩풋볼</Text>
        <Text style={globalStyles.footerText}>Nice플랩은 플랩풋볼의 API를 활용한 비인가 서비스입니다.</Text>
        <Text style={globalStyles.footerText}> </Text>
      </View>
    </ScrollView>
  );
};

export default WeatherInfo;