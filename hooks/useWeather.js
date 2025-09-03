// hooks/useWeather.js

// --- 1. Import Section ---
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SunCalc from 'suncalc';

// API
import { 
  fetchKmaWeatherForcast, 
  fetchPlabMatches, 
  fetchUvIndexForcast, 
  fetchAirQualityForcast,
  fetchPastTemperature,
  fetchKmaLiveWeather,      // 실시간 날씨
  fetchCurrentAirQuality, // 실시간 대기질
  fetchCurrentUvIndex,    // 실시간 자외선 지수 API
} from '../api';

// Utils
import {
  getWeatherLocationInfo,
  getDefaultRegionInfo,
  getSeason,
  getDustGradeFromValue,
  getScoreDetailsForHour
} from '../utils';
import { seasonScoreCriteria } from '../configs/exerciseScoreCriteria';


// --- 2. Constants ---
const CACHE_KEYS = {
  WEATHER: 'cachedWeatherData',
  PLAB: 'cachedPlabMatches',
  LIVE_WEATHER: 'cachedLiveWeatherData', // [추가] 실시간 날씨 캐시 키
  LAST_UPDATE: 'cachedLastUpdateTime',
};


// --- 3. Helper Functions ---

/**
 * AsyncStorage에서 모든 캐시 데이터를 불러옵니다.
 */
const loadCache = async (setters) => {
  const { setWeatherData, setPlabMatches, setLiveData, setLastUpdateTime } = setters;
  const [[, weatherJSON], [, plabJSON], [, liveJSON], [, time]] = await AsyncStorage.multiGet([
    CACHE_KEYS.WEATHER,
    CACHE_KEYS.PLAB,
    CACHE_KEYS.LIVE_WEATHER,
    CACHE_KEYS.LAST_UPDATE,
  ]);

  const weather = weatherJSON ? JSON.parse(weatherJSON) : null;
  const plab = plabJSON ? JSON.parse(plabJSON) : [];
  const live = liveJSON ? JSON.parse(liveJSON) : null;

  if (weather) setWeatherData(weather);
  if (plab) setPlabMatches(plab);
  if (live) setLiveData(live);
  if (time) setLastUpdateTime(time);
  
  return { weather, plab, live, time };
};

/**
 * 새로운 데이터를 AsyncStorage에 저장합니다.
 */
const updateCache = async (data, setters) => {
  const { weatherData, plabMatches, liveData } = data;
  const { setLastUpdateTime } = setters;

  const now = new Date();
  const newUpdateTime = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  
  await AsyncStorage.multiSet([
    [CACHE_KEYS.WEATHER, JSON.stringify(weatherData)],
    [CACHE_KEYS.PLAB, JSON.stringify(plabMatches)],
    [CACHE_KEYS.LIVE_WEATHER, JSON.stringify(liveData)],
    [CACHE_KEYS.LAST_UPDATE, newUpdateTime],
  ]);

  setLastUpdateTime(newUpdateTime);
};

/**
 * 예보 관련 데이터를 시간대별로 병합합니다.
 */
const mergeForecastData = (weatherResult, uvResult, airResult) => {
  if (!weatherResult?.list) return [];
  
  return weatherResult.list.filter(Boolean).map(hourlyData => {
    const weatherItemDate = new Date(hourlyData.dt * 1000);
    let uvIndexToUse = '정보없음';
    if (uvResult?.hourlyUv) {
      const hourKey = weatherItemDate.getHours();
      uvIndexToUse = uvResult.hourlyUv[hourKey] ?? '정보없음';
    }

    // 예보 데이터이므로 airResult에서 시간대에 맞는 예보 값을 찾아야 합니다.
    // 여기서는 간단하게 첫 번째 예보 값을 사용하거나, 시간대별 매칭 로직이 필요합니다.
    const pm10Grade = airResult?.pm10 ?? '정보없음';
    const pm25Grade = airResult?.pm25 ?? '정보없음';

    return { ...hourlyData, uvIndex: uvIndexToUse, pm10Grade, pm25Grade };
  });
};


// --- 4. Main useWeather Hook ---
export const useWeather = (locationName = "내 위치") => {
  const [weatherData, setWeatherData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [plabMatches, setPlabMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [season, setSeason] = useState('summer');
  const [daylightInfo, setDaylightInfo] = useState(null);

  const loadAllData = useCallback(async () => {
  setIsLoading(true);
  setErrorMsg(null);

  const fetchLiveAirQualityWithFallback = async (stationList) => {
    if (!stationList || stationList.length === 0) return null;
    for (const station of stationList.slice(0, 3)) {
      console.log(`[현재값] '${station.stationName}' 측정소 정보 조회를 시도합니다.`);
      const result = await fetchCurrentAirQuality(station.stationName);
      if (result) return result;
      console.log(`[현재값] '${station.stationName}' 조회 실패. 다음으로 넘어갑니다.`);
    }
    return null;
  };
  
  try {
    const cached = await loadCache({ setWeatherData, setPlabMatches, setLiveData, setLastUpdateTime });
    const locationInfo = await getWeatherLocationInfo(locationName) || getDefaultRegionInfo();
    if (!locationInfo) throw new Error('위치 정보를 확인할 수 없습니다.');
    
    const now = new Date();
    if (locationInfo.coords) {
      const times = SunCalc.getTimes(now, locationInfo.coords.latitude, location.coords.longitude);
      setDaylightInfo({ sunrise: times.sunrise, sunset: times.sunset, dawn: times.dawn, dusk: times.dusk });
    }

    // [개선 1] 실시간 대기질 조회를 Promise.allSettled에 포함시켜 병렬로 실행
    const [
      pastTempRes,
      forecastRes,
      liveWeatherRes,
      uvForcastRes,
      airqualityForcastRes,
      currentAirRes,
      currentUvRes,
    ] = await Promise.allSettled([
      fetchPastTemperature(locationInfo.stationId),
      fetchKmaWeatherForcast(locationInfo.grid),
      fetchKmaLiveWeather(locationInfo.grid),
      fetchUvIndexForcast(locationInfo.areaNo),
      fetchAirQualityForcast(locationInfo.airQualityRegion),
      fetchLiveAirQualityWithFallback(locationInfo.stationList),
      fetchCurrentUvIndex(locationInfo.areaNo),
    ]);

      // 5. API 결과 처리
      // 5-1. 계절 처리
      const pastTemp = pastTempRes.status === 'fulfilled' ? pastTempRes.value : null;
      const currentSeason = getSeason(pastTemp);
      setSeason(currentSeason);
      
      const weatherResult = forecastRes.status === 'fulfilled' ? forecastRes.value : cached.weather;
      const uvResult = uvForcastRes.status === 'fulfilled' ? uvForcastRes.value : null;
      const airResult = airqualityForcastRes.status === 'fulfilled' ? airqualityForcastRes.value : null;
      const mergedList = mergeForecastData(weatherResult, uvResult, airResult); 
      const finalWeatherData = {
        ...weatherResult,
        city: { ...weatherResult?.city, name: locationInfo.currentCity },
        list: mergedList,
      };
      setWeatherData(finalWeatherData);
      
      const liveWeatherResult = liveWeatherRes.status === 'fulfilled' ? liveWeatherRes.value : cached.live;
      const currentAirResult = currentAirRes.status === 'fulfilled' ? currentAirRes.value : null;
      const currentUvResult = currentUvRes.status === 'fulfilled' ? currentUvRes.value : null;
      
      let finalLiveData = null; // 👈 [개선 2] 최종 liveData를 저장할 변수 선언
      if (liveWeatherResult) {
        const currentUvIndex = currentUvResult ?? '정보없음';
        const combined = {
          locationName: locationInfo.currentCity,
          ...liveWeatherResult,
          pm10Grade: getDustGradeFromValue('pm10', currentAirResult?.pm10Value),
          pm25Grade: getDustGradeFromValue('pm25', currentAirResult?.pm25Value),
          uvIndex: currentUvIndex,
        };
        const weights = seasonScoreCriteria[currentSeason];
        const scores = getScoreDetailsForHour(combined, weights, currentSeason);
        finalLiveData = { ...combined, ...scores }; // 👈 변수에 최종 데이터 할당
        setLiveData(finalLiveData);
      }

      const newPlabMatches = await fetchPlabMatches(finalWeatherData.list, locationInfo.regionId, locationInfo.cities);
      setPlabMatches(newPlabMatches || []);

      await updateCache(
        // [개선 2] state 대신 새로 만든 변수를 캐시에 저장
        { weatherData: finalWeatherData, plabMatches: newPlabMatches || [], liveData: finalLiveData },
        { setLastUpdateTime }
      );
      
      setToastMessage('최신 정보로 업데이트했습니다.');

    } catch (err) {
      setErrorMsg(err.message);
      setToastMessage('정보를 가져오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [locationName]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
    refetch: loadAllData, 
    clearToast: () => setToastMessage(null) 
  };
};