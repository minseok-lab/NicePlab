// utils/plabLevelFormatter.js

import { PLAB_LEVEL_TIERS } from '../constants';

// '정보 없음' 또는 예외 상황을 위한 기본값 객체
const UNKNOWN_TIER = { name: '정보 없음', en_name: 'unknown' };

/**
 * 숫자 레벨에 해당하는 티어 객체 전체를 반환합니다.
 * @param {number|string} level - 변환할 숫자 레벨 (예: 2.8, "[2.8]", "루키")
 * @returns {object} 티어 객체 (예: { name: '아마추어4', en_name: 'amateur4', ... })
 */
export const getTierFromLevel = (level) => {
  // 1. "루키"와 같이 이미 텍스트인 경우
  if (typeof level === 'string' && isNaN(parseFloat(level.replace(/[\[\]]/g, '')))) {
    const levelName = level.replace(/[\[\]]/g, '');
    // PLAB_LEVEL_TIERS 배열에서 해당 이름을 가진 객체를 찾아 반환
    const foundTier = PLAB_LEVEL_TIERS.find(tier => tier.name === levelName);
    return foundTier || UNKNOWN_TIER;
  }
  
  // 2. 숫자 형식의 문자열 또는 숫자를 처리
  const numericLevel = parseFloat(String(level).replace(/[\[\]]/g, ''));

  if (isNaN(numericLevel)) {
    return UNKNOWN_TIER;
  }

  // 3. 레벨 구간을 순회하며 맞는 티어 객체를 찾습니다.
  for (const tier of PLAB_LEVEL_TIERS) {
    if (numericLevel >= tier.min_level && numericLevel <= tier.max_level) {
      return tier; // name(string) 대신 객체(object)를 반환!
    }
  }

  // 4. 모든 구간에 해당하지 않으면 '루키' 티어 객체를 찾아 반환
  return PLAB_LEVEL_TIERS.find(tier => tier.name === '루키') || UNKNOWN_TIER;
};