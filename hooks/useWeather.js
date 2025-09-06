// hooks/useWeather.js

// 1. Import Section
// 1) React
import { useState, useEffect, useCallback } from 'react';
import SunCalc from 'suncalc';

// Utils 함수들을 가져옵니다.
import {
  getWeatherLocationInfo,
  getDefaultRegionInfo,
} from '../utils/locationUtils';
import {
  loadCachedData,
  updateCachedData,
  fetchAllRemoteData,
  processAndCombineData,
  fetchFilteredPlabMatches,
} from '../utils/weatherDataHandler';

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
  };
};
