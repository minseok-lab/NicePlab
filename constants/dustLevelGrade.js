// constants/dustLevelGrade.js

/**
 * 미세먼지(PM10)와 초미세먼지(PM25)의 등급 기준표입니다.
 * 낮은 threshold부터 순서대로 정의해야 합니다.
 */
export const DUST_THRESHOLDS = {
  // 미세먼지(PM10) 기준 (㎍/m³)
  pm10: [
    { threshold: 30, grade: '좋음' },
    { threshold: 80, grade: '보통' },
    { threshold: 150, grade: '나쁨' },
    { threshold: Infinity, grade: '매우나쁨' }, // 가장 마지막 값은 무한대로 설정
  ],
  // 초미세먼지(PM25) 기준 (㎍/m³)
  pm25: [
    { threshold: 15, grade: '좋음' },
    { threshold: 35, grade: '보통' },
    { threshold: 75, grade: '나쁨' },
    { threshold: Infinity, grade: '매우나쁨' },
  ],
};
