// providers/locationProvider.js

import * as Location from 'expo-location';
import { KMA_AREA_CODES } from '../constants';

/**
 * 사용자의 현재 GPS 좌표와 주소 정보를 가져옵니다.
 * @returns {Promise<{coords: {latitude: number, longitude: number}, address: Object}>}
 */
export async function fetchUserGpsLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied.');
  }

  const location = await Location.getCurrentPositionAsync({});
  const addresses = await Location.reverseGeocodeAsync(location.coords);

  if (!addresses || addresses.length === 0) {
    throw new Error('Failed to reverse geocode location.');
  }

  return { coords: location.coords, address: addresses[0] };
}

/**
 * 지역 이름으로 KMA 코드 데이터에서 해당 지역 정보를 찾습니다.
 * @param {string} name - "서울특별시 종로구" 형식의 지역 이름
 * @returns {Object | undefined} 찾은 지역 정보 객체
 */
export const findLocationDataByName = name => {
  return KMA_AREA_CODES.find(
    item => `${item['1단계']} ${item['2단계']}` === name,
  );
};

// ⭐ 1. 이 함수를 새로 추가합니다. (기존 getUniqueLocations와 동일)
/**
 * 검색 화면에서 사용할 중복 없는 전체 지역 목록을 반환합니다.
 * @returns {{id: number, name: string, gridX: number, gridY: number}[]}
 */
export const fetchAllSearchableLocations = () => {
  const locations = [];
  const uniqueKeys = new Set();

  KMA_AREA_CODES.forEach(item => {
    if (!item['2단계']) {
      return;
    }
    const key = `${item['1단계']}_${item['2단계']}`;
    if (uniqueKeys.has(key)) {
      return;
    }
    uniqueKeys.add(key);
    locations.push({
      id: item['행정구역코드'],
      name: `${item['1단계']} ${item['2단계']}`,
      gridX: item.gridX,
      gridY: item.gridY,
    });
  });

  return locations;
};
