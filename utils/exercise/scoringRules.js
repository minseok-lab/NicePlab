// utils/exercise/exerciseScoringRules.js

import {
  humidityThresholds,
  windSpeedThresholds,
  airQualityGradeMap,
} from '../../configs/exerciseScoreCriteria.js';

// --- 핵심 점수 계산 헬퍼 함수들 ---

// 1) WBGT(습구흑구온도) 계산 및 점수화
function calculateWbgt(temp, humidity) {
  const es = 6.1078 * Math.pow(10, (7.5 * temp) / (237.3 + temp));
  const e = (humidity / 100) * es;
  return 0.567 * temp + 0.393 * e + 3.94;
}

function getWbgtScore(wbgt) {
  if (wbgt < 26) return 100;
  if (wbgt < 31) return 360 - 10 * wbgt; // 26~31 구간 선형 보간
  if (wbgt < 32.2) return 20;
  return 0;
}

// 2) 기온에 따른 점수화
function getTemperatureScore(temp) {
  const tempDifference = Math.abs(temp - 18);
  const score = 100 - tempDifference * (10 / 3);
  return Math.max(0, score);
}

// 3) 습도에 따른 점수화
// ✨ Key Improvement: Config의 기준표를 받아 점수를 계산하므로, 기준이 바뀌어도 이 함수는 수정할 필요가 없습니다.
function getHumidityScore(humidity) {
  // 최적 구간 우선 확인 (config 순서와 무관하게)
  if (humidity >= 45 && humidity <= 55) return 100;

  const found = humidityThresholds.find(item => humidity <= item.maxHumidity);
  return found ? found.score : 25; // 85 초과는 20점
}

// 4) 풍속에 따른 점수화
function getWindSpeedScore(speed) {
  const found = windSpeedThresholds.find(item => speed < item.maxSpeed);
  return found ? found.score : 20;
}

// 5) 자외선 지수(UV Index) 점수화
function getUvIndexScore(uvi) {
  const parsedUvi = parseFloat(uvi);
  if (isNaN(parsedUvi) || parsedUvi < 0 || parsedUvi <= 2) return 100;
  if (parsedUvi > 10) return 0;
  if (parsedUvi > 7) return 20;
  return 120 - 10 * parsedUvi; // 2~7 구간 선형 보간
}

// 6) 날씨 상태 및 강수 형태에 따른 점수화
function getWeatherConditionScore(sky, pty, season) {
  if (pty > 0) {
    if ([1, 4, 5].includes(pty)) return 10; // 비/빗방울
    if ([2, 6].includes(pty)) return 20; // 비/눈
    if ([3, 7].includes(pty)) return 30; // 눈/눈날림
    return 0;
  }
  // 계절별로 하늘 상태 점수를 다르게 부여
  switch (season) {
    case 'spring':
    case 'autumn':
      if (sky === 1) return 90; // 맑음
      if (sky === 3) return 100; // 구름많음
      if (sky === 4) return 90; // 흐림
      break;
    case 'summer':
      if (sky === 1) return 90; // 맑음
      if (sky === 3) return 95; // 구름많음
      if (sky === 4) return 100; // 흐림
      break;
    case 'winter':
      if (sky === 1) return 100; // 맑음
      if (sky === 3) return 95; // 구름많음
      if (sky === 4) return 90; // 흐림
      break;
    default:
      // 혹시 모를 예외상황에서는 기본 점수 부여
      if (sky === 1) return 100;
      if (sky === 3) return 95;
      if (sky === 4) return 90;
      break;
  }
  return 50;
}

// 7) 미세먼지/초미세먼지 등급을 점수로 변환
function getAirQualityScore(grade) {
  return airQualityGradeMap[grade] ?? 50; // 정보없음 등 예외 케이스는 50점
}

// 8) SunCalc의 정확한 시간대를 사용하여 일광 점수를 계산합니다.
/*
 * @param {number} dt - 확인할 시간의 timestamp
 * @param {object} daylightInfo - dawn, sunrise, sunset, dusk 시간 정보가 담긴 객체
 * @returns {number} 일광 점수 (50, 80, 100)
 */
function getDaylightScore(dt, daylightInfo) {
  // daylightInfo가 아직 준비되지 않았으면 기본 점수를 반환합니다.
  if (!daylightInfo) {
    return 80; // 또는 100
  }

  // 1. 필요한 시간들을 모두 가져옵니다.
  const currentTime = dt * 1000;
  const dawnTime = daylightInfo.dawn.getTime(); // 여명 시작
  const sunriseTime = daylightInfo.sunrise.getTime(); // 일출
  const sunsetTime = daylightInfo.sunset.getTime(); // 일몰
  const duskTime = daylightInfo.dusk.getTime(); // 황혼 종료

  // 2. 시간대에 따라 점수를 반환합니다.

  // 완전한 낮 (일출 ~ 일몰)
  if (currentTime >= sunriseTime && currentTime <= sunsetTime) {
    return 100;
  }

  // 어둑어둑한 시간 (여명 또는 황혼)
  // (여명 시작 ~ 일출 전) OR (일몰 후 ~ 황혼 종료)
  if (
    (currentTime >= dawnTime && currentTime < sunriseTime) ||
    (currentTime > sunsetTime && currentTime <= duskTime)
  ) {
    return 80;
  }

  // 그 외 시간은 모두 완전한 밤으로 간주합니다.
  return 50;
}

/**
 * ✨ Key Improvement: 모든 규칙을 객체 하나로 묶어 내보냅니다.
 * 이렇게 하면 Calculator에서 어떤 규칙을 사용할지 동적으로 결정할 수 있어 확장성이 극대화됩니다.
 * 새로운 규칙(예: pollen)을 추가하려면 이 객체에 한 줄만 추가하면 됩니다.
 */
export const scoringRules = {
  wbgt: data => getWbgtScore(calculateWbgt(data.temp, data.humidity)),
  temp: (data, season) => getTemperatureScore(data.temp),
  humidity: (data, season) => getHumidityScore(data.humidity),
  wind: (data, season) => getWindSpeedScore(data.wind_speed),
  uvIndex: (data, season) => getUvIndexScore(data.uvIndex),
  condition: (data, season) =>
    getWeatherConditionScore(data.sky, data.pty, season),
  pm10: (data, season) => getAirQualityScore(data.pm10Grade),
  pm25: (data, season) => getAirQualityScore(data.pm25Grade),
  daylight: (data, season, daylightInfo) => {
    // daylightInfo가 아직 준비되지 않았다면(null 또는 undefined),
    // .sunrise 속성을 읽기 전에 즉시 기본 점수를 반환하여 충돌을 방지합니다.
    if (!daylightInfo) {
      return 50; // 기본 점수
    }

    // daylightInfo가 유효할 때만 getDaylightScore 함수를 호출합니다.
    return getDaylightScore(
      data.dt,
      daylightInfo.sunrise,
      daylightInfo.sunset,
      season,
    );
  },
};
