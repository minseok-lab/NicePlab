// hooks/useWeather.js

// 1. Import Section
// 1) React
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SunCalc from 'suncalc';

// 2) API 호출 함수들을 가져옵니다.
import {
  fetchKmaWeatherForcast, // 기상청 단기예보조회
  fetchPlabMatches, // 플랩 매치
  fetchUvIndexForcast, // 자외선 지수 예보
  fetchAirQualityForcast, // 대기질(미세먼지) 예보
  fetchPastTemperature, // 과거 기온 목록
  fetchKmaLiveWeather, // 기상청 초단기실황조회
  fetchCurrentSkyCondition, // 기상청 초단기예보조회
  fetchCurrentAirQuality, // 실시간 대기질
} from '../api';

// Utils 함수들을 가져옵니다.
import {
  getWeatherLocationInfo,
  getDefaultRegionInfo,
  getSeason,
  getDustGradeFromValue,
  getScoreDetailsForHour,
  getCurrentUvFromForecast,
} from '../utils';
import { seasonScoreCriteria } from '../configs/exerciseScoreCriteria';

// 2. @description 캐시 키를 관리하는 객체
const CACHE_KEYS = {
  WEATHER: 'cachedWeatherData', // 날씨 예보 캐시 키
  PLAB: 'cachedPlabMatches',
  LIVE_WEATHER: 'cachedLiveWeatherData', // 실시간 날씨 캐시 키
  LAST_UPDATE: 'cachedLastUpdateTime',
};

// 3. Helper Functions

/**
 * 1) @description AsyncStorage에서 캐시된 데이터를 안전하게 불러옵니다.
 **** @returns {Promise<object>} 캐시된 데이터 객체 { weather, plab, live, time }
 */
const loadCachedData = async () => {
  try {
    const [[, weatherJSON], [, plabJSON], [, liveJSON], [, time]] =
      await AsyncStorage.multiGet(Object.values(CACHE_KEYS));

    // JSON.parse 실패에 대비하여 try-catch 사용
    const weather = weatherJSON ? JSON.parse(weatherJSON) : null;
    const plab = plabJSON ? JSON.parse(plabJSON) : [];
    const live = liveJSON ? JSON.parse(liveJSON) : null;

    return { weather, plab, live, time };
  } catch (error) {
    console.error('캐시 로딩 실패:', error);
    // 오류 발생 시 캐시 초기화
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    return { weather: null, plab: [], live: null, time: null };
  }
};

/**
 * 2) @description 새로운 데이터를 AsyncStorage에 캐시하고 마지막 업데이트 시간을 저장합니다.
 **** @param {object} data - 캐시할 데이터 { weatherData, plabMatches, liveData }
 **** @returns {Promise<string>} 새로운 업데이트 시간
 */
const updateCachedData = async data => {
  const { weatherData, plabMatches, liveData } = data;
  const newUpdateTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const cachePairs = [
    [CACHE_KEYS.WEATHER, JSON.stringify(weatherData)],
    [CACHE_KEYS.PLAB, JSON.stringify(plabMatches)],
    [CACHE_KEYS.LIVE_WEATHER, JSON.stringify(liveData)],
    [CACHE_KEYS.LAST_UPDATE, newUpdateTime],
  ];

  await AsyncStorage.multiSet(cachePairs);
  return newUpdateTime;
};

/**
 * 3) @description 날씨, 자외선, 대기질 예보 데이터를 하나의 객체로 병합합니다.
 **** @param {object} weatherResult - 기상청 날씨 예보 API 결과
 **** @param {object} uvResult - 자외선 지수 예보 API 결과
 **** @param {object} airResult - 대기질 예보 API 결과
 **** @returns {Array} 시간별 예보 데이터가 병합된 배열
 */
const mergeForecastData = (weatherResult, uvResult, airResult) => {
  if (!weatherResult?.list) return [];

  return weatherResult.list
    .filter(Boolean) // null 또는 undefined 아이템 제거
    .map(hourlyData => {
      const weatherItemDate = new Date(hourlyData.dt * 1000);

      // 시간대에 맞는 자외선 지수 찾기
      const hourKey = weatherItemDate.getHours();
      const uvIndex = uvResult?.hourlyUv?.[hourKey] ?? '정보없음';

      // 예보 데이터이므로 airResult에서 시간대에 맞는 예보 값을 찾아야 합니다.
      // 여기서는 간단하게 첫 번째 예보 값을 사용하거나, 시간대별 매칭 로직이 필요합니다.
      // 대기질 등급 정보
      const pm10Grade = airResult?.pm10 ?? '정보없음';
      const pm25Grade = airResult?.pm25 ?? '정보없음';

      return { ...hourlyData, uvIndex, pm10Grade, pm25Grade };
    });
};

// 4. Main useWeather Hook
/**
 * 1) @description 날씨, 대기질, Plab 매치 등 모든 관련 데이터를 가져오고 관리하는 커스텀 훅
 **** @param {string} [locationName='내 위치'] - 조회할 위치의 이름
 */
export const useWeather = (locationName = '내 위치') => {
  // === 상태 관리 (State Management) ===
  const [weatherData, setWeatherData] = useState(null); // 종합 날씨 예보 데이터
  const [liveData, setLiveData] = useState(null); // 실시간 날씨 데이터
  const [plabMatches, setPlabMatches] = useState([]); // 추천 플랩 매치 목록
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [errorMsg, setErrorMsg] = useState(null); // 에러 메시지
  const [lastUpdateTime, setLastUpdateTime] = useState(null); // 마지막 업데이트 시간
  const [toastMessage, setToastMessage] = useState(null); // 사용자에게 보여줄 토스트 메시지
  const [season, setSeason] = useState('summer'); // 현재 계절
  const [daylightInfo, setDaylightInfo] = useState(null); // 일출/일몰 정보

  /**
   * 2) @description 모든 데이터를 로드, 처리, 업데이트하는 메인 함수
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // (1) 캐시 데이터 로드
      const cached = await loadCachedData();
      if (cached.weather) setWeatherData(cached.weather);
      if (cached.plab) setPlabMatches(cached.plab);
      if (cached.live) setLiveData(cached.live);
      if (cached.time) setLastUpdateTime(cached.time);

      // (2) 위치 정보 가져오기
      const locationInfo =
        (await getWeatherLocationInfo(locationName)) || getDefaultRegionInfo();
      if (!locationInfo) throw new Error('위치 정보를 확인할 수 없습니다.');

      // (3) 일출/일몰 정보 계산
      if (locationInfo.coords) {
        const times = SunCalc.getTimes(
          new Date(),
          locationInfo.coords.latitude,
          locationInfo.coords.longitude,
        );
        setDaylightInfo({ sunrise: times.sunrise, sunset: times.sunset });
      }

      // (4) 모든 외부 API 병렬 호출
      const apiResults = await fetchAllRemoteData(locationInfo);

      // (5) API 결과와 위치 정보를 가공하고 조합
      const { finalWeatherData, finalLiveData, currentSeason } =
        processAndCombineData(apiResults, locationInfo, cached);

      setWeatherData(finalWeatherData);
      setSeason(currentSeason);
      if (finalLiveData) setLiveData(finalLiveData);

      // (6) 가공된 날씨 데이터 기반으로 Plab 매치 정보 가져오기
      const newPlabMatches = await fetchPlabMatches(
        finalWeatherData.list,
        locationInfo.regionId,
        locationInfo.cities,
      );
      setPlabMatches(newPlabMatches || []);

      // (7) 최신 데이터를 캐시에 저장
      const newUpdateTime = await updateCachedData({
        weatherData: finalWeatherData,
        plabMatches: newPlabMatches || [],
        liveData: finalLiveData,
      });
      setLastUpdateTime(newUpdateTime);

      setToastMessage('최신 정보로 업데이트했습니다.');
    } catch (err) {
      setErrorMsg(err.message);
      setToastMessage('정보를 가져오는 데 실패했습니다.');
      console.error('데이터 로딩 중 에러 발생:', err);
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
    clearToast: () => setToastMessage(null),
  };
};

// 5. Helper Functions

/**
 * 1) @description 위치 정보를 기반으로 모든 외부 API를 병렬로 호출합니다.
 **** @param {object} locationInfo - 위치 정보 객체
 **** @returns {Promise<object>} 각 API의 결과값을 담은 객체
 */
const fetchAllRemoteData = async locationInfo => {
  // (1) 여러 측정소 중 유효한 데이터를 가져올 때까지 순차적으로 시도
  const fetchLiveAirQualityWithFallback = async stationList => {
    if (!stationList || stationList.length === 0) return null;
    for (const station of stationList.slice(0, 3)) {
      // 최대 3개까지만 시도
      const result = await fetchCurrentAirQuality(station.stationName);
      if (result) return result;
    }
    return null;
  };

  const results = await Promise.allSettled([
    fetchPastTemperature(locationInfo.stationId), // 과거 기온 (계절 판단용)
    fetchKmaWeatherForcast(locationInfo.grid), // 날씨 예보
    fetchUvIndexForcast(locationInfo.areaNo), // 자외선 예보
    fetchAirQualityForcast(locationInfo.airQualityRegion), // 대기질 예보
    fetchKmaLiveWeather(locationInfo.grid), // 실시간 날씨
    fetchCurrentSkyCondition(locationInfo.grid), // 실시간 하늘 상태
    fetchLiveAirQualityWithFallback(locationInfo.stationList), // 실시간 대기질
  ]);

  // (2) Promise.allSettled 결과를 다루기 쉽게 객체 형태로 변환
  const [
    pastTemp,
    forecast,
    uvForcast,
    airForcast,
    liveWeather,
    currentSky,
    currentAir,
  ] = results.map(res => (res.status === 'fulfilled' ? res.value : null));

  return {
    pastTemp,
    forecast,
    uvForcast,
    airForcast,
    liveWeather,
    currentSky,
    currentAir,
  };
};

/**
 * 2) @description API 결과와 위치 정보를 가공하고 최종 데이터 형태로 조합합니다.
 **** @param {object} apiResults - fetchAllRemoteData 함수의 결과값
 **** @param {object} locationInfo - 위치 정보 객체
 **** @param {object} cachedData - 이전에 캐시된 데이터 (API 실패 시 fallback용)
 **** @returns {{finalWeatherData: object, finalLiveData: object, currentSeason: string}}
 */
const processAndCombineData = (apiResults, locationInfo, cachedData) => {
  const {
    pastTemp,
    forecast,
    uvForcast,
    airForcast,
    liveWeather,
    currentSky,
    currentAir,
  } = apiResults;

  // (1) API 호출 대신, 가져온 예보 데이터로 현재 UV 지수를 직접 계산합니다.
  const currentUv = getCurrentUvFromForecast(uvForcast);

  // (2) 계절 판단
  const currentSeason = getSeason(pastTemp);

  // (3) 예보 데이터 조합 (API 실패 시 캐시 데이터 사용)
  const weatherResult = forecast || cachedData.weather;
  const mergedList = mergeForecastData(weatherResult, uvForcast, airForcast);
  const finalWeatherData = {
    ...weatherResult,
    city: { ...weatherResult?.city, name: locationInfo.currentCity },
    list: mergedList,
  };

  // (4) 실시간 데이터 조합
  let finalLiveData = null;
  const liveWeatherResult = liveWeather || cachedData.live;
  if (liveWeatherResult) {
    const combined = {
      locationName: locationInfo.currentCity,
      ...liveWeatherResult,
      sky: currentSky,
      pm10Grade: getDustGradeFromValue('pm10', currentAir?.pm10Value),
      pm25Grade: getDustGradeFromValue('pm25', currentAir?.pm25Value),
      // 로컬에서 계산된 currentUv 값을 사용합니다.
      uvIndex: currentUv ?? '정보없음',
    };
    const weights = seasonScoreCriteria[currentSeason];
    const scores = getScoreDetailsForHour(combined, weights, currentSeason);
    finalLiveData = { ...combined, ...scores };
  }

  return { finalWeatherData, finalLiveData, currentSeason };
};
