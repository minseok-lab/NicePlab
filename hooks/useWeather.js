// hooks/useWeather.js

// --- 1. Import Section ---
// 1) React 라이브러리
import { useState, useEffect, useCallback } from 'react';

// 2) 서드파티 라이브러리
import AsyncStorage from '@react-native-async-storage/async-storage';

// 3) api 호출 경로를 불러옵니다.
import { fetchKmaWeatherForcast, fetchPlabMatches, fetchUvIndexForcast, fetchAirQualityForcast } from '../api';
import { fetchPastTemperature } from '../api/pastTemperatureApi'

// 4) 리팩토링한 유틸리티 함수들을 가져옵니다.
import { getWeatherLocationInfo, getDefaultRegionInfo } from '../utils/locationUtils';
import { getSeason } from '../utils/getSeason';

// --- 2. Constants ---
const CACHE_KEYS = {
    WEATHER: 'cachedWeatherData',
    PLAB: 'cachedPlabMatches',
    LAST_UPDATE: 'cachedLastUpdateTime',
};

// --- 3. Helper Functions inside the Hook ---

/**
 * AsyncStorage에서 캐시 데이터를 불러와 상태를 업데이트합니다.
 * @returns {Promise<{weather: object|null, plab: any[]|null, time: string|null}>} 캐시된 데이터 객체
 */
const loadCache = async (setWeatherData, setPlabMatches, setLastUpdateTime) => {
    const [[, weatherJSON], [, plabJSON], [, time]] = await AsyncStorage.multiGet([
        CACHE_KEYS.WEATHER,
        CACHE_KEYS.PLAB,
        CACHE_KEYS.LAST_UPDATE,
    ]);

    const weather = weatherJSON ? JSON.parse(weatherJSON) : null;
    const plab = plabJSON ? JSON.parse(plabJSON) : [];

    if (weather) setWeatherData(weather);
    if (plab) setPlabMatches(plab);
    if (time) setLastUpdateTime(time);
    
    return { weather, plab, time };
};

/**
 * 날씨 관련 API(기상청, 자외선, 미세먼지)를 병렬로 호출합니다.
 * @param {object} locationInfo - getWeatherLocationInfo에서 반환된 지역 정보
 * @returns {Promise<{weatherResult: object|null, uvResult: object|null, airResult: object|null}>} API 호출 결과
 */
const fetchWeatherDataApis = async (locationInfo) => {
    const { grid, areaNo, airQualityRegion } = locationInfo;
    const results = await Promise.allSettled([
        fetchKmaWeatherForcast(grid),
        fetchUvIndexForcast(areaNo),
        fetchAirQualityForcast(airQualityRegion),
    ]);

    return {
        weatherResult: results[0].status === 'fulfilled' ? results[0].value : null,
        uvResult: results[1].status === 'fulfilled' ? results[1].value : null,
        airResult: results[2].status === 'fulfilled' ? results[2].value : null,
    };
};

/**
 * 날씨, 자외선, 미세먼지 데이터를 시간대별로 병합합니다.
 * @param {object} weatherResult - 기상청 날씨 API 결과
 * @param {object} uvResult - 자외선 지수 API 결과
 * @param {object} airResult - 미세먼지 API 결과
 * @param {object} cachedWeather - 캐시된 날씨 데이터 (fallback용)
 * @returns {Array} 병합된 시간별 날씨 데이터 리스트
 */
const mergeAllWeatherData = (weatherResult, uvResult, airResult, cachedWeather) => {
    // .map을 실행하기 전에 .filter(Boolean)을 추가하여
    // weatherResult.list 배열에 있을 수 있는 모든 null, undefined 값을 제거합니다.
    return weatherResult.list
        .filter(Boolean) 
        .map(hourlyData => {
            const weatherItemDate = new Date(hourlyData.dt * 1000);
            
            // UV 지수 처리
            let uvIndexToUse = '정보없음';
            if (uvResult) {
                const hourOffset = Math.round((weatherItemDate.getTime() - uvResult.uvBaseDate.getTime()) / (1000 * 60 * 60));
                let foundUv = (hourOffset >= 0 && hourOffset < uvResult.hourlyUv.length) ? uvResult.hourlyUv[hourOffset] : null;
                if (foundUv != null) uvIndexToUse = foundUv;
            } else if (cachedWeather?.list) { // cachedWeather.list가 있는지도 확인
                const cachedItem = cachedWeather.list.find(item => item && item.dt === hourlyData.dt);
                if (cachedItem?.uvIndex != null) uvIndexToUse = cachedItem.uvIndex;
            }

            // 미세먼지 처리
            const getFallbackGrade = (gradeType) => cachedWeather?.list?.find(item => item && item.dt === hourlyData.dt)?.[gradeType] || '정보없음';
            const pm10Grade = airResult ? airResult.pm10 : getFallbackGrade('pm10Grade');
            const pm25Grade = airResult ? airResult.pm25 : getFallbackGrade('pm25Grade');

            return {
                ...hourlyData,
                uvIndex: uvIndexToUse,
                pm10Grade,
                pm25Grade,
            };
        });
};

/**
 * 새로운 데이터와 업데이트 시간을 AsyncStorage에 저장합니다.
 */
const updateCache = async (weatherData, plabMatches, setLastUpdateTime) => {
    const now = new Date();
    const newUpdateTime = `${now.getMonth() + 1}.${now.getDate()}. ${now.getHours() >= 12 ? '오후' : '오전'} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    await AsyncStorage.multiSet([
        [CACHE_KEYS.WEATHER, JSON.stringify(weatherData)],
        [CACHE_KEYS.PLAB, JSON.stringify(plabMatches)],
        [CACHE_KEYS.LAST_UPDATE, newUpdateTime],
    ]);

    setLastUpdateTime(newUpdateTime);
};


// --- 4. Main useWeather Hook ---
export const useWeather = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [plabMatches, setPlabMatches] = useState([]);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [season, setSeason] = useState(null); // ✨ 1. 계절을 저장할 state 추가

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        setToastMessage(null);
        
        try {
            // 1) 캐시에서 데이터 우선 로드 (UI 즉시 반응)
            const cached = await loadCache(setWeatherData, setPlabMatches, setLastUpdateTime);
            
            // 2) 리팩토링된 함수를 사용하여 위치 정보 가져오기
            let locationInfo = await getWeatherLocationInfo();
            if (!locationInfo) {
                locationInfo = getDefaultRegionInfo(); // 실패 시 기본값 사용
                setToastMessage('위치 정보를 찾을 수 없어 기본 지역으로 표시합니다.');
            }

            // ✨ 2. 계절 정보 가져오기 로직 추가
            try {
                const pastData = await fetchPastTemperature(locationInfo.stationId); // 과거 날씨 API 호출
                const currentSeason = getSeason(pastData); // 계절 판단
                if (currentSeason) {
                    setSeason(currentSeason);
                } else {
                    setSeason('summer'); // 실패 시 기본값 'summer'로 설정
                    console.warn("계절 판단 실패. 기본값 'summer'를 사용합니다.");
                    setToastMessage('과거 날씨 정보가 부족해, 현재 계절(여름) 기준으로 추천합니다.');
                }
            } catch (seasonError) {
                setSeason('summer'); // 에러 발생 시에도 기본값 설정
                setToastMessage('과거 날씨 정보를 가져오는 데 실패했습니다.');
                console.error("과거 날씨 조회 또는 계절 판단 중 에러:", seasonError);
            }

            // 3) 원격 API에서 최신 데이터 가져오기
            const { weatherResult, uvResult, airResult } = await fetchWeatherDataApis(locationInfo);
            
            // 4) 핵심 날씨 정보 로드 실패 시, 캐시 데이터를 보여주며 에러 처리
            if (!weatherResult) {
                setToastMessage(`날씨 정보 업데이트 실패. (최근: ${cached.time || '없음'})`);
                throw new Error('Failed to fetch essential weather data.');
            }
            
            // 5) 모든 데이터를 병합하여 최종 날씨 객체 생성
            const mergedList = mergeAllWeatherData(weatherResult, uvResult, airResult, cached.weather);
            const finalWeatherData = {
                ...weatherResult,
                city: { ...weatherResult.city, name: locationInfo.currentCity },
                list: mergedList,
            };
            setWeatherData(finalWeatherData);
            
            // 6) 플랩 매치 정보 업데이트
            const newPlabMatches = await fetchPlabMatches(finalWeatherData.list, locationInfo.regionId, locationInfo.cities);
            if (newPlabMatches) {
                setPlabMatches(newPlabMatches);
            } else {
                setToastMessage(`플랩 매치 정보 업데이트 실패. (최근: ${cached.time || '없음'})`);
                // 플랩 매치 실패는 전체 로직을 중단시키지 않음. 기존 캐시 데이터 유지.
            }
            
            // 7) 성공적으로 가져온 최신 데이터를 캐시에 저장
            await updateCache(finalWeatherData, newPlabMatches || cached.plab, setLastUpdateTime);

        } catch (err) {
            // 위치 권한 거부, 네트워크 에러 등 모든 에러 처리
            setErrorMsg(err.message);
            console.error(err); // 개발자 확인용 에러 로그
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    return { 
        weatherData, 
        errorMsg, 
        isLoading, 
        plabMatches, 
        lastUpdateTime,
        season,
        refetch: loadAllData, 
        toastMessage, 
        clearToast: () => setToastMessage(null) 
    };
};