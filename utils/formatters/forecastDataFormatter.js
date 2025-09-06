// utils/formatters/forecastDataFormatter.js

/**
 * 날씨, 자외선, 대기질 예보 API 결과를 하나의 시간별 예보 배열로 병합합니다.
 * @param {object} weatherResult - 기상청 날씨 예보 API 결과
 * @param {object} uvResult - 자외선 지수 예보 API 결과
 * @param {object} airResult - 대기질 예보 API 결과
 * @returns {Array} 시간별 예보 데이터가 병합된 배열
 */
export const mergeForecastData = (weatherResult, uvResult, airResult) => {
  // weatherResult.list가 없으면 빈 배열을 반환하여 오류를 방지합니다.
  if (!weatherResult?.list) return [];

  return weatherResult.list
    .filter(Boolean) // null 또는 undefined 아이템을 제거합니다.
    .map(hourlyData => {
      const weatherItemDate = new Date(hourlyData.dt * 1000);

      // 해당 시간의 자외선 지수를 찾습니다. 없으면 '정보없음'을 사용합니다.
      const hourKey = weatherItemDate.getHours();
      const uvIndex = uvResult?.hourlyUv?.[hourKey] ?? '정보없음';

      // 대기질 예보 등급을 추가합니다.
      const pm10Grade = airResult?.pm10 ?? '정보없음';
      const pm25Grade = airResult?.pm25 ?? '정보없음';

      return { ...hourlyData, uvIndex, pm10Grade, pm25Grade };
    });
};
