// utils/weatherDataHandler.js

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  fetchKmaWeatherForcast,
  fetchCurrentSkyCondition,
  fetchPlabMatches,
  fetchUvIndexForcast,
  fetchAirQualityForcast,
  fetchCurrentAirQuality,
  fetchPastTemperature,
  fetchKmaLiveWeather,
} from '../apis';

import { getSeason } from './getSeason';
import { getDustGradeFromValue } from './formatters/airQualityFormatter';
import { getScoreDetailsForHour } from './exercise/scoreCalculator';
import { mergeForecastData } from './formatters/forecastDataFormatter';
import { getCurrentUvFromForecast } from './uvUtils';

import { seasonScoreCriteria } from '../configs/exerciseScoreCriteria';

const CACHE_KEYS = {
  WEATHER: 'cachedWeatherData',
  PLAB: 'cachedPlabMatches',
  LIVE_WEATHER: 'cachedLiveWeatherData',
  LAST_UPDATE: 'cachedLastUpdateTime',
};

/**
 * 1) @description AsyncStorage에서 캐시된 데이터를 안전하게 불러옵니다.
 **** @returns {Promise<object>} 캐시된 데이터 객체 { weather, plab, live, time }
 */
export const loadCachedData = async () => {
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
export const updateCachedData = async data => {
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
 * 3) @description 위치 정보를 기반으로 모든 외부 API를 병렬로 호출합니다.
 **** @param {object} locationInfo - 위치 정보 객체
 **** @returns {Promise<object>} 각 API의 결과값을 담은 객체
 */
export const fetchAllRemoteData = async locationInfo => {
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
 * 4) @description API 결과와 위치 정보를 가공하고 최종 데이터 형태로 조합합니다.
 **** @param {object} apiResults - fetchAllRemoteData 함수의 결과값
 **** @param {object} locationInfo - 위치 정보 객체
 **** @param {object} cachedData - 이전에 캐시된 데이터 (API 실패 시 fallback용)
 **** @returns {{finalWeatherData: object, finalLiveData: object, currentSeason: string}}
 */
export const processAndCombineData = (apiResults, locationInfo, cachedData) => {
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

// 5. 처리된 데이터를 기반으로 Plab 매치 정보 가져오기
export const fetchFilteredPlabMatches = async (
  weatherDataList,
  locationInfo,
) => {
  return await fetchPlabMatches(
    weatherDataList,
    locationInfo.regionId,
    locationInfo.cities,
  );
};
