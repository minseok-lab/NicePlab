// utils/uvForcastDataParser.js

/**
 * 기능: 3시간 단위의 UV 데이터를 1시간 단위로 선형 보간합니다.
 * @param {Object} uvRawData - 기상청 API 원본 응답의 item[0] 객체
 * @returns {Object} - 시간(h)을 키로, 보간된 UV 지수를 값으로 갖는 객체
 */
export const interpolateUvData = (uvRawData) => {
  const hourlyUv = {};
  // h0부터 h72까지 3시간 간격으로 반복합니다.
  for (let i = 0; i <= 72; i += 3) {
    const startKey = `h${i}`;
    const endKey = `h${i + 3}`;

    // API 응답에서 시작 시간과 종료 시간의 UV 지수 값을 가져옵니다.
    const startVal = parseFloat(uvRawData[startKey]);
    const endVal = parseFloat(uvRawData[endKey]);

    // 시작값이 유효한 숫자인지 확인합니다.
    if (!isNaN(startVal)) {
      hourlyUv[i] = startVal;

      // 종료값도 유효하다면, 그 사이 값을 선형 보간으로 계산합니다.
      if (!isNaN(endVal)) {
        const difference = endVal - startVal;
        const step = difference / 3.0;
        hourlyUv[i + 1] = parseFloat((startVal + step).toFixed(2));
        hourlyUv[i + 2] = parseFloat((startVal + step * 2).toFixed(2));
      } else {
        // 종료값이 유효하지 않다면, 시작값으로 이후 2시간을 채웁니다.
        hourlyUv[i + 1] = startVal;
        hourlyUv[i + 2] = startVal;
      }
    }
  }
  return hourlyUv;
};