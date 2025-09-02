// /utils/colorFormatter.js

// --- 1. 컬러 팔레트를 불러옵니다. ---
import { PALETTE } from '../../styles/colors';

/**
 * 점수에 따라 동적인 배경색을 반환합니다.
 * @param {number} score - 점수 (50 ~ 100)
 * @returns {string} Hex color code
 */
export const getScoreColor = (score) => {
  if (score >= 90) return PALETTE.statusGood;
  if (score >= 80) return PALETTE.statusModerate;
  if (score >= 70) return PALETTE.statusWarning;
  if (score >= 60) return PALETTE.statusBad;
  if (score >= 50) return PALETTE.statusVeryBad;
  return PALETTE.textMuted; // 점수 기본값은 textMuted 색상 사용
};

/**
 * 자외선(UV) 지수에 따라 텍스트 색상을 반환합니다.
 */
export const getUvColor = (uv) => {
  if (uv <= 2) return PALETTE.statusGood;
  if (uv <= 5) return PALETTE.statusModerate;
  if (uv <= 7) return PALETTE.statusWarning;
  if (uv <= 10) return PALETTE.statusBad;
  return PALETTE.statusVeryBad;
};

const DUST_GRADE_COLORS = {
  좋음: PALETTE.statusGood,
  보통: PALETTE.statusModerate,
  나쁨: PALETTE.statusWarning,
  매우나쁨: PALETTE.statusVeryBad,
};

/**
 * 미세먼지 등급에 따라 텍스트 색상을 반환합니다.
 */
export const getDustColor = (grade) => {
  return DUST_GRADE_COLORS[grade] || PALETTE.statusDefault;
};