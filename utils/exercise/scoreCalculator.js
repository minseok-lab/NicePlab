// utils/exercise/scoreCalculator.js

// --- import 구문 ---
import {
  seasonScoreCriteria,
  exclusionConditions,
} from '../../configs/exerciseScoreCriteria';
import { scoringRules } from './scoringRules';

function isExcluded(data) {
  if (!data) return true;
  const { temp, humidity, pm10Grade, pm25Grade } = data;
  const {
    temp: tempRule,
    humidity: humidityRule,
    pm10Grade: pm10Rule,
    pm25Grade: pm25Rule,
  } = exclusionConditions;
  return (
    temp < tempRule.min ||
    temp >= tempRule.max ||
    humidity >= humidityRule.max ||
    pm10Grade === pm10Rule ||
    pm25Grade === pm25Rule
  );
}

export function calculateScoreForHour(data, weights, season) {
  if (isExcluded(data)) return -1;

  let totalWeightedScore = 0;
  for (const key in weights) {
    if (scoringRules[key]) {
      const score = scoringRules[key](data, season);
      if (score !== null && score !== undefined) {
        totalWeightedScore += score * weights[key];
      }
    }
  }
  return totalWeightedScore;
}

export const getBestExerciseTimes = (weatherList, season) => {
  if (!Array.isArray(weatherList) || weatherList.length === 0 || !season) {
    return [];
  }
  const currentWeights = seasonScoreCriteria[season];
  if (!currentWeights) {
    console.warn(`'${season}'에 대한 가중치가 없어 계산을 건너뜁니다.`);
    return [];
  }

  const averagedScoredList = [];
  for (let i = 0; i < weatherList.length - 1; i++) {
    const startHourData = weatherList[i];
    const nextHourData = weatherList[i + 1];
    if (!startHourData || !nextHourData) continue;

    const startHourScore = calculateScoreForHour(
      startHourData,
      currentWeights,
      season,
    );
    const nextHourScore = calculateScoreForHour(
      nextHourData,
      currentWeights,
      season,
    );

    let averageScore = -1;
    if (startHourScore !== -1 && nextHourScore !== -1) {
      averageScore = (startHourScore + nextHourScore) / 2;
    }
    averagedScoredList.push({
      ...startHourData,
      totalScore: Math.round(averageScore * 10) / 10,
    });
  }

  return averagedScoredList
    .filter(item => item.totalScore >= 10)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 50);
};

/**
 * 특정 시간의 각 날씨 요소별 점수와 가중치가 적용된 총점을 계산하여 객체로 반환합니다.
 * exclusionConditions(-1 처리)를 적용하지 않습니다.
 * @param {object} data - 시간별 날씨 데이터
 * @param {object} weights - 계절별 가중치
 * @param {string} season - 현재 계절
 * @returns {object} - 각 요소별 점수(예: tempScore)와 최종 점수(totalScore)가 포함된 객체
 */
export function getScoreDetailsForHour(data, weights, season) {
  const scoreDetails = {};
  let totalWeightedScore = 0;

  for (const key in weights) {
    if (scoringRules[key]) {
      const score = scoringRules[key](data, season);
      if (score !== null && score !== undefined) {
        // 예: 'temp'에 대한 점수는 'tempScore'라는 키로 저장
        scoreDetails[`${key}Score`] = score;
        totalWeightedScore += score * weights[key];
      }
    }
  }

  scoreDetails.totalScore = totalWeightedScore;
  return scoreDetails;
}
