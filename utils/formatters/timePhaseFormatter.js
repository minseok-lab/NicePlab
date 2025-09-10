// utils/formatters/timePhaseFormatter.js

import SunCalc from 'suncalc';

/**
 * 특정 날짜와 위치를 기준으로 시간대를 계산합니다. (기존 함수)
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

// --- ✨ 타임존을 지원하는 새로운 포맷팅 함수들 ---

/**
 * 추천 시간 카드 헤더에 사용할 날짜/시간 문자열을 생성합니다. (예: "9월 10일 수요일 22시")
 * @param {number} timestamp - Unix timestamp (초 단위)
 * @param {string} [timezone='Asia/Seoul'] - IANA 시간대 이름
 * @returns {string} - 포맷팅된 날짜/시간 문자열
 */
export const formatDateTimeForCard = (timestamp, timezone = 'Asia/Seoul') => {
  const date = new Date(timestamp * 1000);
  const options = {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  };

  // Intl API는 "YYYY년 M월 D일 오전/오후 H:M:S" 와 같은 형식을 반환하므로,
  // 원하는 "M월 D일 요일 HH시" 형식으로 가공합니다.
  const formatter = new Intl.DateTimeFormat('ko-KR', options);
  const parts = formatter.formatToParts(date);

  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const weekday = parts.find(p => p.type === 'weekday').value;
  const hour = parts.find(p => p.type === 'hour').value;

  return `${month}월 ${day}일 ${weekday} ${hour}시`;
};

/**
 * 일출/일몰 시간 등을 'HH:mm' 형식으로 포맷팅합니다. (예: "05:30")
 * @param {Date | number} dateInput - Date 객체 또는 Unix timestamp (초 단위)
 * @param {string} [timezone='Asia/Seoul'] - IANA 시간대 이름
 * @returns {string} - 포맷팅된 시간 문자열
 */
export const formatTime = (dateInput, timezone = 'Asia/Seoul') => {
  const date =
    typeof dateInput === 'number' ? new Date(dateInput * 1000) : dateInput;
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(date);
};

/**
 * 마지막 업데이트 시간을 'YYYY.MM.DD HH:mm' 형식으로 포맷팅합니다.
 * @param {string} isoString - ISO 형식의 날짜 문자열
 * @param {string} [timezone='Asia/Seoul'] - IANA 시간대 이름
 * @returns {string} - 포맷팅된 날짜/시간 문자열
 */
export const formatLastUpdateTime = (isoString, timezone = 'Asia/Seoul') => {
  if (!isoString) return '업데이트 정보 없음';
  const date = new Date(isoString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  };
  // "YYYY. MM. DD. HH:mm" 형식에서 마지막 점을 제거합니다.
  return new Intl.DateTimeFormat('ko-KR', options)
    .format(date)
    .replace(/\.\s*$/, '');
};
