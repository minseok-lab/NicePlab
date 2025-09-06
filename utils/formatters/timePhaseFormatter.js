// utils/formatters/timePhaseFormatter.js

import SunCalc from 'suncalc';

/**
 * 특정 날짜와 위치를 기준으로 시간대를 계산합니다.
 * @param {Date} date - 계산할 날짜 객체
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @returns {string} 'sunrise', 'sunset', 'day', 'night' 중 하나
 */
export function getTimePeriod(date, latitude, longitude) {
  // 위도, 경도 정보가 없으면 기본값 'day'를 반환하여 안정성 확보
  if (latitude === undefined || longitude === undefined) {
    return 'day';
  }

  const sunTimes = SunCalc.getTimes(date, latitude, longitude);
  const { sunrise, sunset, dawn, dusk } = sunTimes;

  // getTime()을 사용하여 정확한 시간(ms)을 비교합니다.
  const time = date.getTime();
  if (time >= dawn.getTime() && time < sunrise.getTime()) return 'sunrise';
  if (time >= sunset.getTime() && time < dusk.getTime()) return 'sunset';
  if (time >= sunrise.getTime() && time < sunset.getTime()) return 'day';
  return 'night';
}
