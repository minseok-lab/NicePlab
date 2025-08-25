// exerciseScoreCriteria.js

/**
 * 각 날씨 항목별 점수 계산 가중치
 * 전체 합이 1.0이 되도록 관리하는 것을 권장합니다.
 */
export const weights = {
    wbgt: 0.3,
    temp: 0.015,
    humidity: 0.015,
    wind: 0.07,
    uvIndex: 0.1,
    condition: 0.3,
    pm10: 0.1,
    pm25: 0.1,
};

/**
 * 운동 부적합으로 판단하여 점수 계산에서 제외하는 조건
 */
export const exclusionConditions = {
    temp: { min: 0, max: 31 },
    humidity: { max: 90 },
    pm10Grade: "매우나쁨",
    pm25Grade: "매우나쁨",
};


// --- 점수 계산 기준표 ---

/**
 * 풍속(m/s)에 따른 점수 기준표
 * maxSpeed: 이 속력 '미만'일 경우 해당하는 점수를 부여합니다.
 */
export const windSpeedThresholds = [
  { maxSpeed: 2, score: 100 },
  { maxSpeed: 3, score: 95 },
  { maxSpeed: 4, score: 90 },
  { maxSpeed: 5, score: 80 },
  { maxSpeed: 6, score: 70 },
  { maxSpeed: 7, score: 60 },
  { maxSpeed: 8, score: 50 },
  { maxSpeed: 9, score: 40 },
  { maxSpeed: 10, score: 30 },
  // 10 m/s 이상은 20점
];

/**
 * 습도(%)에 따른 점수 기준표
 * maxHumidity: 이 습도 '이하'일 경우 해당하는 점수를 부여합니다.
 * ✨ Key Improvement: if-else 문을 데이터 기반 구조로 변경하여 가독성과 유지보수성을 높였습니다.
 */
export const humidityThresholds = [
    { maxHumidity: 25, score: 20 },
    { maxHumidity: 35, score: 65 },
    { maxHumidity: 45, score: 90 },
    { maxHumidity: 55, score: 100 }, // 최적 구간
    { maxHumidity: 65, score: 80 },
    { maxHumidity: 75, score: 60 },
    { maxHumidity: 85, score: 40 },
    // 85% 초과는 20점
];

/**
 * 미세먼지 등급별 점수
 */
export const airQualityGradeMap = {
    "좋음": 100,
    "보통": 85,
    "나쁨": 30,
    "매우나쁨": 0
};