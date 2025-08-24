// /utils/colorFormatter.js

// 1. 색상 팔레트를 중앙에서 관리합니다.
// - 유지보수성: 색상 변경 시 이 객체만 수정하면 모든 함수에 일괄 적용됩니다.
// - 가독성: 색상의 의미가 GOOD, MODERATE 등으로 명확하게 드러납니다.
const PALETTE = {
  GOOD: '#0040D3',
  MODERATE: '#35B847',
  WARNING: '#FBCE33',
  BAD: '#E16F24',
  VERY_BAD: '#C60F14',
  DEFAULT: '#555',
  DARK_DEFAULT: '#888',
};

/**
 * 점수에 따라 동적인 배경색을 반환합니다.
 * @param {number} score - 점수 (50 ~ 100)
 * @returns {string} Hex color code
 */
export const getScoreColor = (score) => {
  // 2. 하드코딩된 색상 코드 대신, 의미를 가진 팔레트 상수를 사용합니다.
  if (score >= 90) return PALETTE.GOOD;
  if (score >= 80) return PALETTE.MODERATE;
  if (score >= 70) return PALETTE.WARNING;
  if (score >= 60) return PALETTE.BAD;
  if (score >= 50) return PALETTE.VERY_BAD;
  return PALETTE.DARK_DEFAULT;
};

/**
 * 자외선(UV) 지수에 따라 텍스트 색상을 반환합니다.
 * @param {number} uv - 자외선 지수
 * @returns {string} Hex color code
 */
export const getUvColor = (uv) => {
  if (uv <= 2) return PALETTE.GOOD;
  if (uv <= 5) return PALETTE.MODERATE;
  if (uv <= 7) return PALETTE.WARNING;
  if (uv <= 10) return PALETTE.BAD;
  return PALETTE.VERY_BAD;
};

// 3. switch문을 더 간결한 객체 조회 방식으로 변경합니다.
// - 가독성 및 확장성: 등급과 색상의 매핑 관계가 한눈에 들어오며, 새로운 등급 추가가 용이합니다.
const DUST_GRADE_COLORS = {
  좋음: PALETTE.GOOD,
  보통: PALETTE.MODERATE,
  나쁨: PALETTE.WARNING,
  매우나쁨: PALETTE.VERY_BAD,
};

/**
 * 미세먼지/초미세먼지 등급(문자열)에 따라 텍스트 색상을 반환합니다.
 * @param {string} grade - "좋음", "보통", "나쁨", "매우나쁨" 등의 예보 등급
 * @returns {string} Hex color code
 */
export const getDustColor = (grade) => {
  return DUST_GRADE_COLORS[grade] || PALETTE.DEFAULT;
};