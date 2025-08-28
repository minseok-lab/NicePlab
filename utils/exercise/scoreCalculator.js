// utils/exercise/scoreCalculator.js

// --- import 구문 ---
import { seasonScoreCriteria, exclusionConditions } from '../../configs/exerciseScoreCriteria';
import { scoringRules } from './scoringRules';

function isExcluded(data) {
    if (!data) return true;
    const { temp, humidity, pm10Grade, pm25Grade } = data;
    const { temp: tempRule, humidity: humidityRule, pm10Grade: pm10Rule, pm25Grade: pm25Rule } = exclusionConditions;
    return (
        temp < tempRule.min || temp >= tempRule.max ||
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

        const startHourScore = calculateScoreForHour(startHourData, currentWeights, season);
        const nextHourScore = calculateScoreForHour(nextHourData, currentWeights, season);

        let averageScore = -1;
        if (startHourScore !== -1 && nextHourScore !== -1) {
            averageScore = (startHourScore + nextHourScore) / 2;
        }
        averagedScoredList.push({
            ...startHourData,
            totalScore: Math.round(averageScore * 10) / 10
        });
    }

    return averagedScoredList
        .filter(item => item.totalScore >= 10)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 50);
};