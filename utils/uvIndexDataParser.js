// utils/uvIndexDataParser.js

/**
 * 3시간 단위의 UV 데이터를 1시간 단위로 선형 보간합니다.
 * @param {Object} uvRawData - API 원본 응답의 item[0] 객체
 * @returns {Object|null} - 시간(h)을 키로, 보간된 UV 지수를 값으로 갖는 객체. 유효한 데이터가 없으면 null.

export function interpolateUvData(uvRawData) {
  if (!uvRawData) {
    return null;
  }

  const hourlyUv = {};
  // h0부터 h72까지 3시간 간격으로 순회
  for (let i = 0; i <= 72; i += 3) {
    const startKey = `h${i}`;
    const endKey = `h${i + 3}`;

    // API 응답에 해당 키가 없는 경우를 대비
    if (!uvRawData.hasOwnProperty(startKey)) continue;

    const startValStr = uvRawData[startKey];
    const startVal = startValStr !== "" ? parseFloat(startValStr) : NaN;

    if (!isNaN(startVal)) {
      hourlyUv[i] = startVal;

      const endValStr = uvRawData[endKey];
      const endVal = (endValStr !== undefined && endValStr !== "") ? parseFloat(endValStr) : NaN;

      const step = !isNaN(endVal) ? (endVal - startVal) / 3.0 : 0;
      hourlyUv[i + 1] = parseFloat((startVal + step).toFixed(2));
      hourlyUv[i + 2] = parseFloat((startVal + step * 2).toFixed(2));
    }
  }
  
  return Object.keys(hourlyUv).length > 0 ? hourlyUv : null;
}
  */