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
  const sunTimes = SunCalc.getTimes(date, latitude, longitude);
  const { sunrise, sunset, dawn, dusk } = sunTimes;

  if (date >= dawn && date < sunrise) return 'sunrise';
  if (date >= sunset && date < dusk) return 'sunset';
  if (date >= sunrise && date < sunset) return 'day';
  return 'night';
}