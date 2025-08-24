// utils/exerciseScorer.js

// --- 1. 핵심 점수 계산 헬퍼 함수들 ---

// 1) WBGT(습구흑구온도) 계산 및 점수화
/**
 * 기온과 습도를 이용해 WBGT(습구흑구온도) 근사치를 계산합니다.
 * 이 값은 실제 인체가 느끼는 열 스트레스를 가장 잘 반영합니다.
 * @param {number} temp - 기온 (°C)
 * @param {number} humidity - 상대 습도 (%)
 * @returns {number} - 계산된 WBGT 값
 */
function calculateWbgt(temp, humidity) {
    // 수증기압(e) 계산 (Magnus-Tetens 근사식)
    const es = 6.1078 * Math.pow(10, (7.5 * temp) / (237.3 + temp));
    const e = (humidity / 100) * es;

    // WBGT 근사치 계산
    const wbgt = 0.567 * temp + 0.393 * e + 3.94;
    return wbgt;
}

/**
 * WBGT(습구흑구온도) 값에 따라 열 스트레스 위험 점수를 반환합니다.
 * 특정 구간(26~31)은 소수점 값에 따라 점수가 선형적으로 감소합니다.
 * @param {number} wbgt - 계산된 WBGT 값
 * @returns {number}
 */
function getWbgtScore(wbgt) {
  // 1. '안전' 구간
  if (wbgt < 26) {
    return 100;
  }
  
  // 2. '점진적 감소' 구간 (핵심 변경 사항)
  //    - wbgt 26일 때 100점, 31일 때 50점이 되도록 선형 보간
  //    - wbgt가 1 증가할 때마다 점수는 10점씩 감소
  if (wbgt < 31) {
    const score = 360 - 10 * wbgt;
    return score;
  }

  // 3. '위험' 및 '매우 위험' 구간
  if (wbgt < 32.2) {
    return 20;
  }
  
  // 4. '운동 중단' 구간
  return 0;
}
// ---------------------------------


// 2) 기온에 따른 점수화
/**
 * 기온(temp)에 따라 운동 적합도 점수를 반환합니다.
 * 18°C를 100점으로 설정하고, 18°C에서 3°C 멀어질 때마다 10점씩 점진적으로 감점됩니다.
 * (1°C당 약 3.33점 감점)
 * @param {number} temp - 기온 (°C)
 * @returns {number} - 계산된 운동 적합도 점수
 */
function getTemperatureScore(temp) {

  // 1. 최적 온도(18°C)와의 절대적인 온도 차이를 계산합니다.
  const tempDifference = Math.abs(temp - 18);

  // 2. 100점에서 온도 차이에 따른 감점을 적용합니다.
  //    (온도 차이 * 1°C당 감점 폭)
  //    10 / 3 = 3°C당 10점 감점
  const score = 100 - (tempDifference * (10 / 3));

  // 3. 점수가 0점 미만으로 내려가지 않도록 최저점을 0점으로 설정합니다.
  return Math.max(0, score);
}
// ---------------------------------

// 3) 습도에 따라 이 점수를 반환합니다.
function getHumidityScore(humidity) {
    if (45 <= humidity && humidity <= 55) return 100; // 최적
    if (35 <= humidity && humidity < 45) return 90;
    if (55 < humidity && humidity <= 65) return 80;
    if (25 <= humidity && humidity < 35) return 65;
    if (65 < humidity && humidity <= 75) return 60;
    if (75 < humidity && humidity <= 85) return 40;
    if (humidity < 25 || humidity > 85) return 20;
    return 50; // 정보없음 등 예외 케이스는 50점
}
// ---------------------------------

// 4) 풍속에 따라 이 점수를 반환합니다.
/**
 * 기능: 풍속(m/s)에 따른 점수 기준을 정의한 조회 테이블입니다.
 * maxSpeed: 이 속력 '미만'일 경우 해당하는 점수를 부여합니다.
 * 배열은 maxSpeed 오름차순으로 정렬되어야 합니다.
 */
const windSpeedThresholds = [
  { maxSpeed: 2, score: 100 },
  { maxSpeed: 3, score: 95 },
  { maxSpeed: 4, score: 90 },
  { maxSpeed: 5, score: 80 },
  { maxSpeed: 6, score: 70 },
  { maxSpeed: 7, score: 60 },
  { maxSpeed: 8, score: 50 },
  { maxSpeed: 9, score: 40 },
  { maxSpeed: 10, score: 30 },
];

/**
 * @param {number} speed - 풍속 (m/s)
 * @returns {number}
 */
function getWindSpeedScore(speed) {
  // windSpeedThresholds 배열에서 현재 풍속에 맞는 첫 번째 구간을 찾습니다.
  const found = windSpeedThresholds.find(item => speed < item.maxSpeed);

  // 맞는 구간을 찾으면 해당 점수를 반환하고,
  // 찾지 못했다면(speed가 10 이상인 경우) 기본 점수인 20점을 반환합니다.
  return found ? found.score : 20;
}
// ---------------------------------

// 5) 자외선 지수(UV Index) 점수화
/**
 * 소수점 지수까지 계산하며, 다양한 조건에 따라 점수를 차등 부여합니다.
 * * @param {number|string|null} uvi - 자외선 지수. API 응답에 따라 숫자, 문자열, null일 수 있습니다.
 * @returns {number} - 계산된 운동 적합도 점수
 */
function getUvIndexScore(uvi) {
  // 1. uvi 값이 유효한 숫자인지 확인합니다.
  // uvi는 API 응답에 따라 숫자, 문자열, 또는 null일 수 있으므로 parseFloat로 숫자로 변환합니다.
  const parsedUvi = parseFloat(uvi);

  // 2. '정보 없음' 또는 음수 값(밤 시간대 등)은 100점을 반환합니다.
  if (isNaN(parsedUvi) || parsedUvi < 0) {
    return 100;
  }

  // 3. uvi 지수 값에 따라 점수를 구간별로 반환합니다.
  if (parsedUvi > 10) {
    return 0;   // 10 초과: '위험'
  }
  if (parsedUvi > 7) {
    return 20;  // 7 초과 10 이하: '매우 높음'
  }
  if (parsedUvi <= 2) {
    return 100; // 2 이하: '낮음'
  }
  
  // 4. (2 < uvi <= 7) 구간은 선형 보간법으로 점수를 계산합니다.
  //    - uvi가 2일 때 100점, 7일 때 50점이 되도록 설정
  //    - uvi가 1 증가할 때마다 점수는 10점씩 감소
  const score = 120 - 10 * parsedUvi;
  return score;
}
// ---------------------------------

// 6) 날씨 상태 및 강수 형태에 따른 점수화
/**
 * @param {number} sky - 하늘 상태 코드
 * @param {number} pty - 강수 형태 코드
 */
function getWeatherConditionScore(sky, pty) {
    if (pty > 0) { // 비나 눈이 올 때
        if (pty === 1 || pty === 4 || pty === 5) return 10; // 비/빗방울
        if (pty === 2 || pty === 6) return 20; // 비/눈
        if (pty === 3 || pty === 7) return 30; // 눈/빗방울
        return 0; // 눈 또는 진눈깨비
    }
    if (sky === 1) return 100; // 맑음
    if (sky === 2) return 95;  // 구름조금
    if (sky === 3) return 95;  // 구름많음
    if (sky === 4) return 90;  // 흐림
    return 50; // 기타
}
// ---------------------------------

// 7) 미세먼지/초미세먼지 등급을 점수로 변환
/**
 * @param {string} grade - "좋음", "보통" 등 등급 문자열
 */
function getAirQualityScore(grade) {
    const gradeMap = { "좋음": 100, "보통": 85, "나쁨": 30, "매우나쁨": 0 };
    return gradeMap[grade] || null; // 정보없음 등 예외 케이스는 50점
}
// ---------------------------------


// --- 2. 메인 점수 계산 함수 ---
/**
 * 한 시간 분량의 날씨 데이터를 받아, 모든 규칙을 적용한 최종 점수를 반환합니다.
 * @param {object} data - 한 시간 분량의 날씨 데이터
 * @param {object} weights - 가중치 객체
 * @returns {number} - 계산된 최종 점수 (-1은 '제외'를 의미)
 */
function calculateScoreForHour(data, weights) {
    const { temp, humidity, pm10Grade, pm25Grade } = data;

    // 1) 운동 부적합 조건 사전 제외
    const isExcluded = 
        temp < 0 || temp >= 31 ||
        humidity >= 90 ||
        pm10Grade === "매우나쁨" ||
        pm25Grade === "매우나쁨"; 

    if (isExcluded) {
        return -1; // 제외 조건에 해당하면 -1 반환
    }
    
    // 2) 각 항목별 점수 계산
    const scores = {
        wbgt: getWbgtScore(calculateWbgt(temp, humidity)),
        temp: getTemperatureScore(temp),
        humidity: getHumidityScore(humidity),
        wind: getWindSpeedScore(data.wind),
        uvIndex: getUvIndexScore(data.uvIndex),
        condition: getWeatherConditionScore(data.sky, data.pty),
        pm10: getAirQualityScore(pm10Grade),
        pm25: getAirQualityScore(pm25Grade),
    };

    // 3) 동적 가중치 적용 및 100점 만점 환산
    let totalWeightedScore = 0;
    let totalActiveWeight = 0;

    // 각 항목별로 유효한 점수에 대해서만 가중치를 적용합니다.
    for (const key in weights) {
        if (scores[key] !== null && scores[key] !== undefined) {
            totalWeightedScore += scores[key] * weights[key];
            totalActiveWeight += weights[key];
        }
    }
    
    // 유효한 항목이 하나라도 있으면 가중 평균을 계산합니다.
    if (totalActiveWeight > 0) {
        return totalWeightedScore / totalActiveWeight;
    }

    return 0; // 유효한 데이터가 하나도 없는 경우
}
// ---------------------------------

// --- 3. 최적 운동 시간대 추천 함수 ---
/**
 * 전체 날씨 데이터 리스트를 받아, '2시간 평균 점수'가 가장 높은 시간대를 추천합니다.
 * @param {Array} weatherList - 시간대별 날씨 데이터 배열
 * @returns {Array} - 추천 시간대 정보 배열
 */
// 2시간 평균 점수를 계산하여 상위 50개 시간대를 반환합니다.
export const getBestExerciseTimes = (weatherList) => {
    // 1) 각 항목별 가중치 설정 (총합 1.0)
    const weights = {
        wbgt: 0.3,
        temp: 0.015,
        humidity: 0.015,
        wind: 0.07,
        uvIndex: 0.1,
        condition: 0.3,
        pm10: 0.1,
        pm25: 0.1,
    };

    const averagedScoredList = [];

    // 2) 마지막 시간대를 제외하고 루프 (2시간 점수 계산을 위해)
    for (let i = 0; i < weatherList.length - 1; i++) {
        const startHourData = weatherList[i];
        const nextHourData = weatherList[i + 1];

        // 3) 시작 시간과 그 다음 시간의 점수를 각각 계산
        const startHourScore = calculateScoreForHour(startHourData, weights);
        const nextHourScore = calculateScoreForHour(nextHourData, weights);

        let averageScore = 0;
        
        // 4) 두 시간 중 하나라도 '제외(-1)' 조건에 해당하면, 해당 2시간 타임슬롯은 제외
        if (startHourScore === -1 || nextHourScore === -1) {
            averageScore = -1;
        } else {
            // 5) 두 시간의 평균 점수 계산
            averageScore = (startHourScore + nextHourScore) / 2;
        }

        averagedScoredList.push({
            ...startHourData, // 6) 시작 시간 기준으로 정보 저장
            totalScore: averageScore
        });
    }

    // 7) 최종적으로 유효한 시간대만 필터링하고 점수 순으로 정렬
    return averagedScoredList
        .filter(item => item.totalScore >= 10)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 50);
};