/*
// utils/weatherCache.js

import AsyncStorage from '@react-native-async-storage/async-storage';

// 캐시 키와 유효 시간을 상수로 관리하여 실수를 방지합니다.
const CACHE_KEY = 'niceplab_weather_cache';
const CACHE_EXPIRY_MINUTES = 15; // 캐시 유효 시간: 15분
const CACHE_EXPIRY_MS = CACHE_EXPIRY_MINUTES * 60 * 1000; // 분을 밀리초로 변환

/**
 * 캐시가 유효한지 검사합니다.
 * @param {number | undefined} timestamp - 검사할 타임스탬프 (밀리초)
 * @returns {boolean} - 타임스탬프가 유효하면 true, 아니면 false

export function isCacheValid(timestamp) {
  // 타임스탬프가 없으면(최초 실행 등) 무효 처리
  if (!timestamp) {
    return false;
  }

  const now = new Date().getTime();
  const timeDifference = now - timestamp;

  // 현재 시간과 저장된 시간의 차이가 유효 시간보다 작으면 '유효함'
  return timeDifference < CACHE_EXPIRY_MS;
}

/**
 * AsyncStorage에서 캐시 데이터를 가져옵니다.
 * @returns {Promise<object>} - 파싱된 캐시 데이터 또는 빈 객체

export async function getCache() {
  try {
    const cachedDataString = await AsyncStorage.getItem(CACHE_KEY);
    return cachedDataString ? JSON.parse(cachedDataString) : {};
  } catch (error) {
    console.error('--- 💥 Cache: GET 에러 ---', error);
    return {}; // 에러 발생 시 빈 객체 반환
  }
}

/**
 * 데이터를 AsyncStorage에 캐시합니다.
 * @param {object} dataToCache - 캐시할 데이터 (weatherProcessor의 결과 객체)

export async function setCache(dataToCache) {
  try {
    // 저장하기 직전, 현재 시간을 타임스탬프로 기록하여 추가
    const cachePayload = {
      ...dataToCache,
      lastFetchTimestamp: new Date().getTime(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
    console.log('--- 💾 Cache: 데이터가 성공적으로 저장되었습니다. ---');
  } catch (error) {
    console.error('--- 💥 Cache: SET 에러 ---', error);
  }
}

/**
 * 캐시를 수동으로 삭제합니다. (디버깅 또는 초기화 시 유용)

export async function clearCache() {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('--- 🗑️ Cache: 캐시가 삭제되었습니다. ---');
  } catch (error) {
    console.error('--- 💥 Cache: CLEAR 에러 ---', error);
  }
}
  */