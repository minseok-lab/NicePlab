// components/WeatherInfo.js

import { useState, useMemo } from 'react';
import { ScrollView, View, Text, Button, Linking, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { styles } from '../styles/styles';
import { getBestExerciseTimes } from '../utils/exerciseScorer';
import { formatWeather } from '../utils/weatherFormatter';
import { fetchPlabMatchDetails } from '../api/plabService';
import { getTierFromLevel } from '../utils/plabLevelFormatter';
import { getLevelBadgeUrl } from '../constants/links';
import { getScoreColor, getUvColor, getDustColor } from '../utils/colorFormatter';

// --- Helper Functions --- (이전과 동일)

const getFallbackGrade = (match) => {
    if (typeof match.grade === 'number' && match.grade > 0) {
        return `[${match.grade.toFixed(1)}]`;
    }
    return null;
};

const getAverageLevelInfo = (match) => {
    if (match.confirm_cnt === 0) return '루키';
    if (!match.applys || !Array.isArray(match.applys) || match.applys.length === 0) {
        return getFallbackGrade(match) || '[정보 없음]';
    }
    const levelStats = match.applys.reduce((stats, participant) => {
        if (participant.status !== 'CONFIRM') return stats;
        let level = null;
        if (participant.profile_level?.tier_ko === '루키') level = 2.4;
        else if (participant.level !== null && !isNaN(parseFloat(participant.level))) level = parseFloat(participant.level);
        if (level !== null) {
            stats.sum += level;
            stats.count++;
        }
        return stats;
    }, { sum: 0, count: 0 });

    if (levelStats.count === 0) return getFallbackGrade(match) || '[정보 없음]';
    const averageLevel = levelStats.sum / levelStats.count;
    return `[${averageLevel.toFixed(1)}]`;
};


// --- Main Component ---

const WeatherInfo = ({ weatherData, plabMatches = [], plabLink, lastUpdateTime }) => {
  // --- State ---
  const [expandedTimestamp, setExpandedTimestamp] = useState(null); // ✨ [정의명 통일] 펼쳐진 카드의 timestamp
  const [detailedMatches, setDetailedMatches] = useState({}); // 시간대별 상세 매치 정보
  const [loadingTimestamps, setLoadingTimestamps] = useState(new Set()); // ✨ [정의명 통일] 로딩 중인 timestamp Set

  // --- Memoized Data Processing ---

  // 1. 날씨 점수 기반 상위 20개 추천 시간대 후보 선정
  const bestWeatherTimes = useMemo(() => {
    if (!weatherData?.list) return [];
    const candidates = getBestExerciseTimes(weatherData.list);
    return candidates.slice(0, 20);
  }, [weatherData]);

  // 2. 각 시간대별 유효한(22시 이전) 매치 목록 미리 계산
  const matchesByTimestamp = useMemo(() => { // ✨ [정의명 통일]
    const map = new Map();
    bestWeatherTimes.forEach(weatherItem => {
      const slotStartTime = new Date(weatherItem.dt * 1000);
      const slotEndTime = new Date(slotStartTime.getTime() + 60 * 60 * 1000);
      const filteredMatches = plabMatches.filter(match => {
        const matchStartTime = new Date(match.schedule);
        return matchStartTime >= slotStartTime && matchStartTime < slotEndTime && matchStartTime.getHours() <= 22;
      });
      map.set(weatherItem.dt, filteredMatches);
    });
    return map;
  }, [bestWeatherTimes, plabMatches]);

  // 3. "매치가 하나 이상 있는" 시간대만 최종 필터링하여 상위 5개 선정
  const finalBestTimes = useMemo(() => {
    const filtered = bestWeatherTimes.filter(weatherItem => {
      const matchesInSlot = matchesByTimestamp.get(weatherItem.dt) || [];
      return matchesInSlot.length > 0;
    });
    return filtered.slice(0, 5);
  }, [bestWeatherTimes, matchesByTimestamp]);


  // --- Event Handlers ---

  // 카드 펼치기/접기 및 상세 정보 비동기 로드 핸들러
  const handleToggleCard = async (timestamp) => { // ✨ [정의명 통일]
    // 이미 열려있는 카드를 다시 누르면 닫기
    if (expandedTimestamp === timestamp) {
      setExpandedTimestamp(null);
      return;
    }

    // 새 카드 열기
    setExpandedTimestamp(timestamp);
    
    const matchesToFetch = matchesByTimestamp.get(timestamp) || [];
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

  // --- 🎨 여기가 UI 렌더링 부분입니다 ---
  return (
    <ScrollView>
      <Text style={styles.subHeader}>{weatherData.city.name} 추천 시간대</Text>
      
      {finalBestTimes.length > 0 ? (
        finalBestTimes.map((weatherItem) => {
          // 필요한 데이터를 구조 분해 할당으로 추출합니다.
          const { dt: timestamp, totalScore, temp, sky, pty, humidity, uvIndex, pm10Value, pm25Value } = weatherItem;
          
          const date = new Date(timestamp * 1000);
          const timeStr = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시`;
          const weather = formatWeather(sky, pty);
          const isExpanded = expandedTimestamp === timestamp;
          const isLoading = loadingTimestamps.has(timestamp);
          const matchesForThisSlot = detailedMatches[timestamp] || matchesByTimestamp.get(timestamp) || [];

          // UV 지수와 미세먼지 값이 유효한 숫자인지 확인합니다.
          const validUvIndex = typeof uvIndex === 'number' ? uvIndex : 0;
          const validPm10 = typeof pm10Value === 'number' ? pm10Value : 0;
          const validPm25 = typeof pm25Value === 'number' ? pm25Value : 0;

          return (
            // TouchableOpacity가 카드의 역할을 합니다.
            <TouchableOpacity 
              key={timestamp} 
              style={styles.card}
              onPress={() => handleToggleCard(timestamp)}
              activeOpacity={0.8}
            >
              {/* ✨ 상단: 날짜와 점수 (WeatherCard 구조 적용) ✨ */}
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}> {timeStr}</Text>
                <View style={[styles.scoreBox, { backgroundColor: getScoreColor(totalScore) }]}>
                  <Text style={styles.scoreText}>{totalScore.toFixed(1)}</Text>
                </View>
              </View>

              {/* ✨ 하단: 날씨 정보 (WeatherCard 구조 적용) ✨ */}
              <View style={styles.weatherContent}>
                {/* 1. 기온 */}
                <View style={styles.weatherColumn}>
                  <Text style={styles.tempText}>{Math.round(temp)}°</Text>
                </View>
                
                {/* 2. 날씨 아이콘 */}
                <Image 
                  source={weather.icon} 
                  style={styles.weatherIcon} 
                />

                {/* 3 & 4. 상세 정보 (습도, UV, 미세먼지 등) */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailLabels}>
                    <Text style={styles.detailLabelsText}>습도</Text>
                    <Text style={styles.detailLabelsText}>UV</Text>
                    <Text style={styles.detailLabelsText}>미세먼지</Text>
                    <Text style={styles.detailLabelsText}>초미세먼지</Text>
                  </View>
                  <View style={styles.detailValues}>
                    <Text style={styles.detailValuesText}>{humidity}%</Text>
                    <Text style={[styles.detailValuesText, { color: getUvColor(validUvIndex) }]}>{validUvIndex}</Text>
                    {/* 미세먼지 등급과 색상 적용 */}
                    <Text style={[styles.detailValuesText, { color: getDustColor(weatherItem.pm10Grade) }]}>
                        {weatherItem.pm10Grade || '정보없음'}
                    </Text>
                    {/* 초미세먼지 등급과 색상 적용 */}
                    <Text style={[styles.detailValuesText, { color: getDustColor(weatherItem.pm25Grade) }]}>
                        {weatherItem.pm25Grade || '정보없음'}
                    </Text>
                  </View>
                </View>
              </View>


              {/* 펼쳤을 때 보이는 매치 목록 */}
              {isExpanded && (
                <View style={styles.matchListContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />
                  ) : (
                    matchesForThisSlot.length > 0 ? (
                      matchesForThisSlot.map(match => {
                          const averageLevelInfo = getAverageLevelInfo(match);
                          const tierInfo = getTierFromLevel(averageLevelInfo);
                          const badgeUrl = getLevelBadgeUrl(tierInfo.en_name);

                          return (
                            <TouchableOpacity 
                              key={match.id}
                              onPress={() => Linking.openURL(`https://www.plabfootball.com/match/${match.id}/`)}
                            >
                              <Text style={[styles.matchInfoText, styles.matchLink]}>
                                {`⚽ ${match.label_title}`}
                              </Text>
                              <View style={styles.matchDetailsContainer}>
                                {badgeUrl ? (
                                  <SvgUri width="18" height="18" uri={badgeUrl} style={{ marginRight: 6 }} />
                                ) : (
                                  <Text style={{ marginRight: 6 }}>📊</Text>
                                )}
                                <Text style={styles.matchDetailsText}>
                                  {`평균 레벨: ${tierInfo.name}   [ ${match.confirm_cnt} / ${match.max_player_cnt} ]`}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                      })
                    ) : (
                      <Text style={styles.noMatchText}>✅ 날씨는 최적이지만, 신청 가능한 매치가 없어요!</Text>
                    )
                  )}
                </View>
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