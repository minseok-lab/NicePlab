// exerciseCalculator.js
import { weights, exclusionConditions } from '../../configs/exerciseScoreCriteria.js';
import { scoringRules } from './scoringRules.js';

/**
 * 한 시간 분량의 데이터가 운동 부적합 조건에 해당하는지 확인합니다.
 * @param {object} data - 시간별 날씨 데이터
 * @returns {boolean} - 제외 여부
 */
function isExcluded(data) {
    const { temp, humidity, pm10Grade, pm25Grade } = data;
    const { temp: tempRule, humidity: humidityRule, pm10Grade: pm10Rule, pm25Grade: pm25Rule } = exclusionConditions;

    return (
        temp < tempRule.min || temp >= tempRule.max ||
        humidity >= humidityRule.max ||
        pm10Grade === pm10Rule ||
        pm25Grade === pm25Rule
    );
}

/**
 * 한 시간 분량의 날씨 데이터에 대해 모든 규칙을 적용하여 최종 가중 평균 점수를 계산합니다.
 * @param {object} data - 시간별 날씨 데이터
 * @returns {number} - 계산된 점수 (-1은 '제외'를 의미)
 */
function calculateScoreForHour(data) {
    if (isExcluded(data)) {
        return -1;
    }
    
    let totalWeightedScore = 0;
    let totalActiveWeight = 0;

    // ✨ Key Improvement: 설정된 가중치(weights)를 기준으로 필요한 규칙(rules)을 동적으로 실행합니다.
    // 새로운 점수 항목이 추가되어도 이 코드는 수정할 필요가 없습니다. 확장성 극대화!
    for (const key in weights) {
        if (scoringRules[key]) {
            const score = scoringRules[key](data);
            if (score !== null && score !== undefined) {
                totalWeightedScore += score * weights[key];
                totalActiveWeight += weights[key];
            }
        }
    }
    
    return totalActiveWeight > 0 ? totalWeightedScore / totalActiveWeight : 0;
}

/**
 * 전체 날씨 데이터 리스트를 받아, '2시간 평균 점수'가 가장 높은 시간대를 추천합니다.
 * @param {Array} weatherList - 시간대별 날씨 데이터 배열
 * @returns {Array} - 추천 시간대 정보 배열
 */
export const getBestExerciseTimes = (weatherList) => {
    const averagedScoredList = [];

    for (let i = 0; i < weatherList.length - 1; i++) {
        const startHourData = weatherList[i];
        const nextHourData = weatherList[i + 1];

        const startHourScore = calculateScoreForHour(startHourData);
        const nextHourScore = calculateScoreForHour(nextHourData);

        let averageScore = -1;
        if (startHourScore !== -1 && nextHourScore !== -1) {
            averageScore = (startHourScore + nextHourScore) / 2;
        }

        averagedScoredList.push({
            ...startHourData,
            totalScore: averageScore
        });
    }

    return averagedScoredList
        .filter(item => item.totalScore >= 10)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 50);
};