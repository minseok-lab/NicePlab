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
  // ⭐ KMA_AREA_CODES 배열 전체를 순회하며 일치하는 지역을 찾습니다.
  return KMA_AREA_CODES.find(item => {
    // ⭐ 'fetchAllSearchableLocations'와 동일한 이름 생성 규칙을 적용합니다.
    // ⭐ 1. 먼저 "2단계" 데이터가 없는 항목은 건너뜁니다.
        // 이것이 검색 목록을 만들 때의 핵심 조건과 동일합니다.
        if (!item['2단계']) {
          return false; // find 메소드에서 false를 반환하면 다음 항목으로 넘어갑니다.
        }

        // 2. "2단계"가 있는 항목에 대해서만 이름 비교 로직을 수행합니다.
        const keyName =
          item['1단계'] === item['2단계']
            ? item['1단계']
            : `${item['1단계']} ${item['2단계']}`;

    // ⭐ 이렇게 생성된 이름과 찾으려는 이름을 비교합니다.
    return keyName === name;
  });
};

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

    // ⭐ 1단계와 2단계가 같으면 1단계만, 다르면 조합하여 name을 생성합니다.
    const name =
      item['1단계'] === item['2단계']
        ? item['1단계']
        : `${item['1단계']} ${item['2단계']}`;

    locations.push({
      id: item['행정구역코드'],
      name: name,
      gridX: item.gridX,
      gridY: item.gridY,
    });
  });

  return locations;
};
