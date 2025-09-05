// utils/formatter/uvForcastDataParser.js

/**
 * 기능: 기상청 UV 지수 원본 데이터를 받아 전체 예보 기간에 대해 시간대별로 선형 보간합니다.
 * @param {object} uvRawData - 기상청 API 원본 데이터 객체 ('h0', 'h3' 등 포함)
 * @param {number} baseHour - API 요청의 기준 시간 (예: 6 또는 18)
 * @returns {object} - 절대 시간을 키로, 보간된 UV 지수를 값으로 갖는 전체 예보 객체
 */
export const interpolateUvData = (uvRawData, baseHour) => {
  const points = {};

  // 1. API 데이터를 {절대시간: 값} 형태로 변환합니다. (예: {'15': 5})
  // 기상청이 제공하는 h0 ~ h75 까지의 모든 데이터를 처리합니다.
  for (let i = 0; i <= 75; i += 3) {
    const key = `h${i}`;
    if (uvRawData[key] !== undefined && uvRawData[key] !== '') {
      const absoluteHour = baseHour + i;
      points[absoluteHour] = parseInt(uvRawData[key], 10);
    }
  }

  const hourlyUv = {};
  const sortedHours = Object.keys(points)
    .map(Number)
    .sort((a, b) => a - b);

  // 2. 변환된 데이터를 기반으로 전체 기간에 대해 선형 보간을 수행합니다.
  for (let i = 0; i < sortedHours.length - 1; i++) {
    const startHour = sortedHours[i];
    const endHour = sortedHours[i + 1];
    const startValue = points[startHour];
    const endValue = points[endHour];

    // 시작 지점의 값을 먼저 넣습니다.
    hourlyUv[startHour] = startValue;

    // 두 지점 사이의 값을 보간하여 채웁니다.
    const hourDiff = endHour - startHour;
    if (hourDiff > 1) {
      for (let h = startHour + 1; h < endHour; h++) {
        const progress = (h - startHour) / hourDiff;
        const interpolatedValue =
          startValue + (endValue - startValue) * progress;
        // ✨ [수정] 오늘 하루만 필터링하던 조건을 제거하여 전체 데이터를 포함시킵니다.
        hourlyUv[h] = parseFloat(interpolatedValue.toFixed(2));
      }
    }
  }

  // 3. 마지막 예보 지점을 추가합니다.
  const lastHour = sortedHours[sortedHours.length - 1];
  if (lastHour !== undefined) {
    hourlyUv[lastHour] = points[lastHour];
  }

  return hourlyUv;
};
