// utils/getSeason.js

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
  console.log(`--- 계절 판단 시작 ---`);

  const latestMA = movingAverages[movingAverages.length - 1].movingAverage;
  // DEBUG: 가장 최신 이동 평균 온도를 확인합니다.
  console.log(`[계절 탐색] 지난 평균 기온: ${latestMA}°C`);

  if (latestMA >= 20) return 'summer';
  if (latestMA < 5) return 'winter';

  if (latestMA >= 5 && latestMA < 20) {
    for (let i = movingAverages.length - 2; i >= 0; i--) {
      const pastMA = movingAverages[i].movingAverage;
      if (pastMA >= 20) return 'autumn';
      if (pastMA < 5) return 'spring';
    }
    return 'autumn';
  }
  return null;
}

export const getSeason = pastData => {
  // pastData 객체에서 .list 속성을 추출해야 합니다.
  const dataList = pastData?.list;

  if (!dataList || dataList.length < 10) {
    console.warn(
      '계절을 판단하기에 데이터가 충분하지 않습니다. (최소 10일 필요)',
    );
    return null;
  }

  const movingAverages = calculateMovingAverages(dataList);
  const season = findCurrentSeason(movingAverages);

  // DEBUG: 최종적으로 반환되는 계절을 확인합니다.
  console.log(`[계절 판단 결과]: ${season}`);

  return season;
};
