// /utils/formatter/colorFormatter.js

// --- 1. 컬러 팔레트를 불러옵니다. ---
// PALETTE import 경로는 프로젝트 구조에 맞게 확인해주세요.
import { PALETTE } from '../../styles';

/**
 * 점수에 따라 동적인 배경색을 반환합니다.
 */
export const getScoreColor = score => {
  // ▼▼▼ .common 추가 ▼▼▼
  if (score >= 90) return PALETTE.common.statusGood;
  if (score >= 80) return PALETTE.common.statusModerate;
  if (score >= 70) return PALETTE.common.statusWarning;
  if (score >= 60) return PALETTE.common.statusBad;
  if (score >= 50) return PALETTE.common.statusVeryBad;
  return PALETTE.common.statusExtra;
  // ▲▲▲ .common 추가 ▲▲▲
};

/**
 * 자외선(UV) 지수에 따라 텍스트 색상을 반환합니다.
 */
export const getUvColor = uv => {
  // ▼▼▼ .common 추가 ▼▼▼
  if (uv <= 2) return PALETTE.common.statusGood;
  if (uv <= 5) return PALETTE.common.statusModerate;
  if (uv <= 7) return PALETTE.common.statusWarning;
  if (uv <= 10) return PALETTE.common.statusBad;
  return PALETTE.common.statusVeryBad;
  // ▲▲▲ .common 추가 ▲▲▲
};

const DUST_GRADE_COLORS = {
  // ▼▼▼ .common 추가 ▼▼▼
  좋음: PALETTE.common.statusGood,
  보통: PALETTE.common.statusModerate,
  나쁨: PALETTE.common.statusWarning,
  매우나쁨: PALETTE.common.statusVeryBad,
  // ▲▲▲ .common 추가 ▲▲▲
};

/**
 * 미세먼지 등급에 따라 텍스트 색상을 반환합니다.
 */
export const getDustColor = grade => {
  // ▼▼▼ .common 추가 및 fallback 색상 수정 ▼▼▼
  // 'statusDefault'는 정의되지 않았으므로, textMuted 색상을 기본값으로 사용합니다.
  return DUST_GRADE_COLORS[grade] || PALETTE.common.textMuted;
  // ▲▲▲ .common 추가 및 fallback 색상 수정 ▲▲▲
};
