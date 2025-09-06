// utils/uvUtils.js

/**
 * 시간별 자외선 예보 데이터에서 현재 시간의 자외선 지수를 계산하여 반환합니다.
 * @param {object} forecastData - fetchUvIndexForcast가 반환하는 객체 { hourlyUv, uvBaseDate }
 * @returns {number|null} 현재 자외선 지수 또는 찾을 수 없을 경우 null
 */
export const getCurrentUvFromForecast = forecastData => {
  if (!forecastData?.hourlyUv || !forecastData?.uvBaseDate) {
    console.error('[UV 계산] ❌ 유효하지 않은 예보 데이터입니다.');
    return null;
  }

  const { hourlyUv, uvBaseDate } = forecastData;
  const now = new Date();

  // 기준 시간으로부터 현재까지 몇 시간이 지났는지 계산
  const hoursSinceBase = Math.floor(
    (now.getTime() - uvBaseDate.getTime()) / (1000 * 60 * 60),
  );
  const finalKey = uvBaseDate.getHours() + hoursSinceBase;

  const currentUvIndex = hourlyUv[finalKey];

  if (currentUvIndex !== undefined) {
    return currentUvIndex;
  } else {
    // 예보 범위를 벗어난 경우 등
    return null;
  }
};
