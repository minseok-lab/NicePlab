// components/WeatherInfo.js

// --- 1. Import Section ---
// 1) React 및 React Native 핵심 라이브러리
import { useState, useMemo } from 'react';
import { ScrollView, View, Text, Button, Linking, TouchableOpacity } from 'react-native';

// 2) API 라이브러리
import { fetchPlabMatchDetails } from '../api/plabApi';

// 3) 유틸리티 및 상수 라이브러리
import { getBestExerciseTimes } from '../utils';

// 4) 스타일
import { styles } from '../styles/styles';

// 5) 컴포넌트
import WeatherCard from './WeatherCard';
import MatchDetails from './MatchDetails';


// --- Main Component ---
const WeatherInfo = ({ weatherData, plabMatches = [], plabLink, lastUpdateTime, season }) => {

  // --- State ---
  const [expandedTimestamp, setExpandedTimestamp] = useState(null); // ✨ [정의명 통일] 펼쳐진 카드의 timestamp
  const [detailedMatches, setDetailedMatches] = useState({}); // 시간대별 상세 매치 정보
  const [loadingTimestamps, setLoadingTimestamps] = useState(new Set()); // ✨ [정의명 통일] 로딩 중인 timestamp Set

  // --- Memoized Data Processing ---

  // [개선] 3단계 로직을 하나의 useMemo로 통합하여 성능 및 가독성 향상
  const finalRecommendedSlots = useMemo(() => {
    // 1. 계산에 필요한 데이터가 준비되지 않았다면 즉시 빈 배열을 반환합니다.
    if (!weatherData?.list || !season || !plabMatches) {
      return [];
    }

    // 2. 날씨 점수 기반 상위 20개 추천 시간대 후보를 먼저 선정합니다.
    const bestWeatherCandidates = getBestExerciseTimes(weatherData.list, season).slice(0, 25);

    // 3. 최종 추천 목록 (매치가 있는 시간대)을 담을 배열입니다.
    const filtered = [];

    // 4. 날씨 좋은 시간대 후보를 순회합니다.
    for (const weatherItem of bestWeatherCandidates) {
      const slotStartTime = new Date(weatherItem.dt * 1000);
      const slotEndTime = new Date(slotStartTime.getTime() + 60 * 60 * 1000);

      // 5. 해당 시간대에 매치가 '하나라도 있는지' 확인합니다. (시간 필터 제외)
      // .some()을 사용해 매치를 찾는 즉시 순회를 멈춰 효율적입니다.
      const hasMatchInSlot = plabMatches.some(match => {
        const matchStartTime = new Date(match.schedule);
        return matchStartTime >= slotStartTime && matchStartTime < slotEndTime;
      });

      // 6. 매치가 있다면, 최종 목록에 추가합니다.
      if (hasMatchInSlot) {
        filtered.push(weatherItem);
      }
      
      // 7. 최종 목록이 7개가 채워지면, 더 이상 불필요한 계산을 하지 않고 즉시 종료합니다.
      if (filtered.length === 7) {
        break;
      }
    }

    return filtered;
  }, [weatherData, season, plabMatches]); // 모든 의존성을 명시합니다.


  // --- Event Handlers ---

// 카드 펼치기/접기 및 상세 정보 비동기 로드 핸들러
const handleToggleCard = async (timestamp) => {
  // 이미 열려있는 카드를 다시 누르면 닫기
  if (expandedTimestamp === timestamp) {
    setExpandedTimestamp(null);
    return;
  }

  // 새 카드 열기
  setExpandedTimestamp(timestamp);
  
  //    전체 plabMatches 목록에서 현재 시간대에 맞는 매치를 직접 필터링합니다.
  const slotStartTime = new Date(timestamp * 1000);
  const slotEndTime = new Date(slotStartTime.getTime() + 60 * 60 * 1000);
  
  const matchesToFetch = plabMatches.filter(match => {
    const matchStartTime = new Date(match.schedule);
    return matchStartTime >= slotStartTime && matchStartTime < slotEndTime;
  });

  // 이미 데이터가 있거나, 해당 시간대에 매치가 없으면 API 호출 방지
  if (detailedMatches[timestamp] || matchesToFetch.length === 0) {
    return;
  }

  // 로딩 상태 시작
  setLoadingTimestamps(prev => new Set(prev).add(timestamp));

  try {
    const detailPromises = matchesToFetch.map(match => fetchPlabMatchDetails(match.id));
    const results = await Promise.all(detailPromises);
    
    // 상세 정보 state에 저장 (null 값 제외)
    setDetailedMatches(prev => ({ ...prev, [timestamp]: results.filter(Boolean) }));
  } catch (error) {
    console.error("Failed to fetch match details:", error);
  } finally {
    // 로딩 상태 종료
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
      <Text style={styles.subHeader}>{weatherData?.city?.name || '...'} 추천 시간대</Text>
      
      {finalRecommendedSlots.length > 0 ? (
        finalRecommendedSlots.map((weatherItem) => {
          const { dt: timestamp, matches } = weatherItem; // ❗ weatherItem에서 matches를 바로 가져옵니다.
          const isExpanded = expandedTimestamp === timestamp;
          const isLoading = loadingTimestamps.has(timestamp);
          const matchesForThisSlot = detailedMatches[timestamp] || matches || [];
          
          return (
            // TouchableOpacity가 카드 전체를 감싸고, 클릭 이벤트를 관리합니다.
            <TouchableOpacity 
              key={timestamp} 
              style={styles.card}
              onPress={() => handleToggleCard(timestamp)}
              activeOpacity={0.8}
            >
              {/* 1. 날씨 정보 렌더링은 WeatherCard에 위임 */}
              <WeatherCard weatherItem={weatherItem} />
              
              {/* 2. 펼쳐졌을 때, 매치 정보 렌더링은 MatchDetails에 위임 */}
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
        <Text style={styles.noDataText}>추천할 만한 시간대가 없네요.</Text>
      )}

      {/* 하단 버튼 및 푸터 */}
      <View style={styles.buttonContainer}>
        <Button 
          title="플랩에서 더 많은 매치 찾기" 
          onPress={() => Linking.openURL(plabLink)}
        />
      </View>
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>기상정보출처: 기상청, 에어코리아</Text>
        <Text style={styles.footerText}>날씨 아이콘 : Google Weather API</Text>
        <Text style={styles.footerText}>업데이트 {lastUpdateTime}</Text>
        <Text style={styles.footerText}> </Text>
        <Text style={styles.footerText}>플랩 매치 출처: 플랩풋볼</Text>
        <Text style={styles.footerText}>Nice플랩은 플랩풋볼의 API를 활용한 비인가 서비스입니다.</Text>
        <Text style={styles.footerText}> </Text>
        <Text style={styles.footerText}> </Text>
      </View>
    </ScrollView>
  );
};

export default WeatherInfo;