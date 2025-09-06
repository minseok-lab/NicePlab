// utils/formatter/airQualityFormatter.js

// 1. constants에서 미세먼지 등급표를 가져옵니다.
import { DUST_THRESHOLDS } from '../../constants';

export const getDustGradeFromValue = (type, value) => {
  const numValue = parseInt(value, 10);
  if (isNaN(numValue) || value === '-' || value === null) {
    return '정보없음';
  }

  // 하드코딩된 if문 대신, 설정 객체를 기반으로 등급을 찾습니다.
  const thresholds = DUST_THRESHOLDS[type];
  if (thresholds) {
    // numValue보다 크거나 같은 첫 번째 threshold를 찾습니다.
    const found = thresholds.find(item => numValue <= item.threshold);
    if (found) return found.grade;
  }

  return '정보없음'; //예외 케이스 처리
};
