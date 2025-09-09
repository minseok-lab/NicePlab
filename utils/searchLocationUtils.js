// utils/searchLocationUtils.js

import kmaAreaCodes from '../constants/kmaAreaCodes.json';

/**
 * kmaAreaCodes.json 데이터를 가공하여 검색 화면에 사용할
 * 중복되지 않는 지역 목록을 반환합니다.
 * - '2단계' 정보가 없는 지역은 제외합니다.
 * - '1단계'와 '2단계' 조합이 중복되는 지역은 제외합니다.
 * @returns {{id: number, name: string, gridX: number, gridY: number}[]} 가공된 지역 목록
 */
export const getUniqueLocations = () => {
  const locations = [];
  const uniqueKeys = new Set(); // 중복 조합을 확인하기 위한 Set

  kmaAreaCodes.forEach(item => {
    // '2단계' 정보가 비어있으면 건너뜁니다.
    if (!item['2단계']) {
      return;
    }

    const key = `${item['1단계']}_${item['2단계']}`;

    // 이미 추가된 조합이라면 건너뜁니다.
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

// ✨ 1. 아래 함수를 새로 추가합니다.
/**
 * 지역 이름(e.g., "서울특별시 종로구")으로 kmaAreaCodes 데이터에서
 * 해당 지역의 전체 정보를 찾아서 반환합니다.
 * @param {string} name - 찾고자 하는 지역의 이름
 * @returns {object|null} - 찾은 지역 정보 객체 또는 null
 */
export const findLocationByName = name => {
  // kmaAreaCodes.json 데이터 전체를 순회하며 일치하는 지역을 찾습니다.
  // getUniqueLocations에서 생성된 이름 형식과 동일하게 비교합니다.
  return kmaAreaCodes.find(
    item => `${item['1단계']} ${item['2단계']}` === name,
  );
};
