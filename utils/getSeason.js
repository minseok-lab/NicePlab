// utils/getSeason.js

// ✨ 1. constants 파일에서 방금 정의한 상수를 import 합니다.
import { SEASON_THRESHOLDS } from '../constants/';

function calculateMovingAverages(dataList) {
  const movingAverages = [];
  if (!Array.isArray(dataList) || dataList.length < 10) return [];

  for (let i = 9; i < dataList.length; i++) {
    const tenDaySlice = dataList.slice(i - 9, i + 1);
    const sum = tenDaySlice.reduce((acc, day) => acc + (day.avgTemp || 0), 0);
    const average = sum / 10;
    movingAverages.push({
      date: dataList[i].date,
      movingAverage: parseFloat(average.toFixed(2)),
    });
  }
  return movingAverages;
}

function findCurrentSeason(movingAverages) {
  if (movingAverages.length === 0) return null;

  // DEBUG: 로직 추적을 위해 시작점을 표시합니다.
  console.log(`[계절 탐색] ➡️ 계절 판단 시작`);

  const latestMA = movingAverages[movingAverages.length - 1].movingAverage;
  // DEBUG: 가장 최신 이동 평균 온도를 확인합니다.
  console.log(`[계절 탐색] ✅ 지난 평균 기온: ${latestMA}°C`);

  const { SUMMER_START, WINTER_START } = SEASON_THRESHOLDS;

  if (latestMA >= SUMMER_START) return 'summer';
  if (latestMA < WINTER_START) return 'winter';

  if (latestMA >= WINTER_START && latestMA < SUMMER_START) {
    for (let i = movingAverages.length - 2; i >= 0; i--) {
      const pastMA = movingAverages[i].movingAverage;
      if (pastMA >= SUMMER_START) return 'autumn'; // 여름에서 내려왔으므로 가을
      if (pastMA < WINTER_START) return 'spring'; // 겨울에서 올라왔으므로 봄
    }
    // ✨ 3. (의견) fallback의 이유를 주석으로 명시하면 가독성이 향상됩니다.
    // 전체 기간 동안 기온이 5~20도 사이였다면, 일반적으로 가을로 간주합니다.
    return 'autumn';
  }
  return null;
}

export const getSeason = pastData => {
  // pastData 객체에서 .list 속성을 추출해야 합니다.
  const dataList = pastData?.list;

  if (!dataList || dataList.length < 10) {
    console.warn('[계절 판단] ❌ 데이터가 충분하지 않습니다. (최소 10일 필요)');
    return null;
  }

  const movingAverages = calculateMovingAverages(dataList);
  const season = findCurrentSeason(movingAverages);

  // DEBUG: 최종적으로 반환되는 계절을 확인합니다.
  console.log(`[계절 판단] ✅ ${season}`);

  return season;
};
