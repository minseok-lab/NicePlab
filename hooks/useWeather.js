// hooks/useWeather.js

// --- 1. Import Section ---
// 1) React 및 React Native 핵심 라이브러리
import { useState, useEffect, useCallback } from 'react';

// 2) 서드파티 라이브러리
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// 3) API 호출
import { fetchKmaWeatherData, fetchPlabMatches, fetchUvIndexData, fetchAirQualityData } from '../api';

// 4) Utils
import { getRegionIdFromLocation } from '../utils/locationUtils';

// 2. 캐시 키(저장소의 파일 이름)를 상수로 정의
const CACHE_KEYS = {
  WEATHER: 'cachedWeatherData',
  PLAB: 'cachedPlabMatches',
  LAST_UPDATE: 'cachedLastUpdateTime',
};

export const useWeather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plabMatches, setPlabMatches] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [uvBaseDate, setUvBaseDate] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setToastMessage(null);

      const cachedWeatherJSON = await AsyncStorage.getItem(CACHE_KEYS.WEATHER);
      const cachedWeather = cachedWeatherJSON ? JSON.parse(cachedWeatherJSON) : null;
      const cachedPlabJSON = await AsyncStorage.getItem(CACHE_KEYS.PLAB);
      const cachedPlab = cachedPlabJSON ? JSON.parse(cachedPlabJSON) : null;
      const cachedTime = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);

      if (cachedWeather) setWeatherData(cachedWeather);
      if (cachedPlab) setPlabMatches(cachedPlab);
      if (cachedTime) setLastUpdateTime(cachedTime);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('위치 권한이 거부되었습니다.');
      
      const currentLocation = await Location.getCurrentPositionAsync({});
      const locationInfo = await getRegionIdFromLocation(currentLocation);
      if (!locationInfo) throw new Error('현재 위치의 지역 정보를 찾을 수 없습니다.');
      const { regionId, cities, currentCity, region, areaNo, grid } = locationInfo;

      const results = await Promise.allSettled([
        fetchKmaWeatherData(grid),
        fetchUvIndexData(areaNo),
        fetchAirQualityData(region) // 지역명 전체를 반환합니다.
      ]);

      const weatherResult = results[0].status === 'fulfilled' ? results[0].value : null;
      const uvResult = results[1].status === 'fulfilled' ? results[1].value : null;
      const airResult = results[2].status === 'fulfilled' ? results[2].value : null;

      if (!weatherResult) {
        setToastMessage(`날씨 정보를 불러오지 못했습니다. 최근 업데이트: ${cachedTime || '없음'}`);
      } else {
        if (!uvResult) setToastMessage(`자외선 정보를 불러오지 못했습니다. 최근 업데이트: ${cachedTime || '없음'}`);
        if (!airResult) setToastMessage(`미세먼지 정보를 불러오지 못했습니다. 최근 업데이트: ${cachedTime || '없음'}`);

        const mergedList = weatherResult.list.map(hourlyData => {
            const weatherItemDate = new Date(hourlyData.dt * 1000);
            
            // --- 💡 핵심 수정 부분: UV 지수 처리 로직을 더 명확하게 변경 ---
            let uvIndexToUse = '정보없음';

            if (uvResult) { // 자외선 API 호출에 성공했을 경우
                const hourOffset = Math.round((weatherItemDate.getTime() - uvResult.uvBaseDate.getTime()) / (1000 * 60 * 60));
                
                // 1. 현재 시간대의 UV 지수를 찾아봅니다.
                let foundUv = (hourOffset >= 0 && hourOffset <= 72) ? uvResult.hourlyUv[hourOffset] : null;

                // 2. 현재 시간대 UV 지수가 없으면, 24시간 전 데이터를 찾아봅니다.
                if (foundUv == null) {
                    const fallbackHourOffset = hourOffset - 24;
                    foundUv = (fallbackHourOffset >= 0 && fallbackHourOffset <= 72) ? uvResult.hourlyUv[fallbackHourOffset] : null;
                }

                // 3. 유효한 값을 찾았다면 할당합니다.
                if (foundUv != null) {
                    uvIndexToUse = foundUv;
                }

            } else if (cachedWeather) { // 자외선 API 호출에 실패했고, 캐시 데이터가 있을 경우
                const cachedItem = cachedWeather.list.find(item => item.dt === hourlyData.dt);
                if (cachedItem && cachedItem.uvIndex != null) {
                    uvIndexToUse = cachedItem.uvIndex;
                }
            }

            const pm10Grade = airResult ? airResult.pm10 : (cachedWeather?.list.find(item => item.dt === hourlyData.dt)?.pm10Grade || '정보없음');
            const pm25Grade = airResult ? airResult.pm25 : (cachedWeather?.list.find(item => item.dt === hourlyData.dt)?.pm25Grade || '정보없음');

            return {
              ...hourlyData,
              uvIndex: uvIndexToUse,
              pm10Grade: pm10Grade,
              pm25Grade: pm25Grade,
            };
        });
        
        weatherResult.list = mergedList;
        if (currentCity) weatherResult.city.name = currentCity;
        setWeatherData(weatherResult);
        if (uvResult) setUvBaseDate(uvResult.uvBaseDate);

        const matchesResult = await fetchPlabMatches(weatherResult.list, regionId, cities);
        if (matchesResult) {
            setPlabMatches(matchesResult);
            await AsyncStorage.setItem(CACHE_KEYS.PLAB, JSON.stringify(matchesResult));
        } else {
            setToastMessage(`플랩 매치 정보를 불러오지 못했습니다. 최근 업데이트: ${cachedTime || '없음'}`);
        }

        const now = new Date();
        const newUpdateTime = `${now.getMonth() + 1}.${now.getDate()}. ${now.getHours() >= 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
        setLastUpdateTime(newUpdateTime);
        await AsyncStorage.setItem(CACHE_KEYS.WEATHER, JSON.stringify(weatherResult));
        await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, newUpdateTime);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return { weatherData, errorMsg, isLoading, plabMatches, lastUpdateTime, uvBaseDate, refetch: loadAllData, toastMessage, clearToast: () => setToastMessage(null) };
};