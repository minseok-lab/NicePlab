// utils/formatter/airQualityFormatter.js

/**
 * 기능: 미세먼지/초미세먼지 수치를 바탕으로 등급(좋음, 보통 등)을 반환합니다.
 * @param {'pm10' | 'pm25'} type - 미세먼지 종류
 * @param {string | number} value - API로부터 받은 농도 값
 * @returns {string} - 변환된 등급 문자열
 */
export const getDustGradeFromValue = (type, value) => {
  const numValue = parseInt(value, 10);

  if (isNaN(numValue) || value === '-' || value === null) {
    return '정보없음';
  }

  if (type === 'pm10') {
    if (numValue <= 30) return '좋음';
    if (numValue <= 80) return '보통';
    if (numValue <= 150) return '나쁨';
    return '매우나쁨';
  }

  if (type === 'pm25') {
    if (numValue <= 15) return '좋음';
    if (numValue <= 35) return '보통';
    if (numValue <= 75) return '나쁨';
    return '매우나쁨';
  }

  return '정보없음';
};