// hooks/useWeather.js

// 1. Import Section
// 1) React
import { useState, useEffect, useMemo, useCallback } from 'react';
import SunCalc from 'suncalc';

// Utils 함수들을 가져옵니다.
import {
  getWeatherLocationInfo,
  getDefaultRegionInfo,
} from '../utils/locationResolver';
import {
  loadCachedData,
  updateCachedData,
  fetchAllRemoteData,
  processAndCombineData,
  fetchFilteredPlabMatches,
} from '../utils/weatherDataHandler';
import { getBestExerciseTimes } from '../utils/exercise/scoreCalculator';

// ✨ 변경점: 2. useWeather 훅은 이제 '지휘자' 역할에만 집중합니다.
export const useWeather = (locationName = '내 위치') => {
  const [weatherData, setWeatherData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [plabMatches, setPlabMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [season, setSeason] = useState('summer');
  const [daylightInfo, setDaylightInfo] = useState(null);
  const [genderFilter, setGenderFilter] = useState([]);
  const [levelFilter, setLevelFilter] = useState([]);

  const loadAllData = useCallback(
    async (isRefresh = false) => {
      // 당겨서 새로고침이 아닐 때만 전체 로딩 상태를 true로 설정
      if (!isRefresh) setIsLoading(true);
      setErrorMsg(null);

      try {
        // 캐시 데이터를 'cached' 변수에 저장합니다.
        const cached = await loadCachedData();

        // Step 1: 캐시 로드 (새로고침이 아닐 때만)
        if (!isRefresh) {
          if (cached.weather) setWeatherData(cached.weather);
          if (cached.plab) setPlabMatches(cached.plab);
          if (cached.live) setLiveData(cached.live);
          if (cached.time) setLastUpdateTime(cached.time);
        } // Step 2: 위치 정보 및 모든 API 데이터 가져오기

        const locationInfo =
          (await getWeatherLocationInfo(locationName)) ||
          getDefaultRegionInfo();
        if (!locationInfo) throw new Error('위치 정보를 확인할 수 없습니다.');

        if (locationInfo.coords) {
          const times = SunCalc.getTimes(
            new Date(),
            locationInfo.coords.latitude,
            locationInfo.coords.longitude,
          );
          setDaylightInfo({ sunrise: times.sunrise, sunset: times.sunset });
        }
        const apiResults = await fetchAllRemoteData(locationInfo);

        // Step 3: API 결과 처리
        const { finalWeatherData, finalLiveData, currentSeason } =
          // fallback 데이터로 'weatherData' 대신 'cached.weather'를 사용합니다.
          processAndCombineData(apiResults, locationInfo, cached.weatherData);

        setWeatherData(finalWeatherData);
        setSeason(currentSeason);
        if (finalLiveData) setLiveData(finalLiveData);

        // Step 4: Plab 매치 정보 가져오기
        const newPlabMatches = await fetchFilteredPlabMatches(
          finalWeatherData.list,
          locationInfo,
        );
        setPlabMatches(newPlabMatches || []);

        // Step 5: 최종 데이터를 캐시에 저장
        const newUpdateTime = await updateCachedData({
          weatherData: finalWeatherData,
          plabMatches: newPlabMatches || [],
          liveData: finalLiveData,
        });
        setLastUpdateTime(newUpdateTime);

        // ✨ UX 개선: 새로고침 시 성공 메시지 표시
        if (isRefresh) {
          setToastMessage('최신 정보로 업데이트했습니다.');
        }
      } catch (err) {
        setErrorMsg(err.message);
        // ✨ UX 개선: 새로고침 실패 시에도 메시지 표시
        setToastMessage('정보를 가져오는 데 실패했습니다.');
        console.error('데이터 로딩 중 에러 발생:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [locationName],
  );

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

  useEffect(() => {
    loadAllData(false); // 첫 로딩
  }, [loadAllData]);

  // refetch 함수가 isRefresh 인자를 받도록 수정
  const refetch = useCallback(() => loadAllData(true), [loadAllData]);

  return {
    weatherData,
    liveData,
    plabMatches,
    isLoading,
    errorMsg,
    lastUpdateTime,
    season,
    daylightInfo,
    toastMessage,
    refetch,
    clearToast: () => setToastMessage(null),
    genderFilter,
    setGenderFilter,
    levelFilter,
    setLevelFilter,
    finalRecommendedSlots,
  };
};
