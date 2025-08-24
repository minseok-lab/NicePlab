// api/lifeIndexService.js

const API_KEY = process.env.EXPO_PUBLIC_KMA_LIFE_API_KEY;
const API_BASE_URL = 'https://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4';

/**
 * 기능: 3시간 단위의 UV 데이터를 1시간 단위로 선형 보간합니다.
 * @param {Object} uvRawData - API 원본 응답의 item[0] 객체
 * @returns {Object} - 시간(h)을 키로, 보간된 UV 지수를 값으로 갖는 객체
 */
function interpolateUvData(uvRawData) {
  const hourlyUv = {};
  for (let i = 0; i <= 72; i += 3) {
    const startKey = `h${i}`;
    const endKey = `h${i + 3}`;

    const startVal = parseFloat(uvRawData[startKey]);
    const endVal = parseFloat(uvRawData[endKey]);

    // 시작값이 유효한 숫자인지 먼저 확인
    if (!isNaN(startVal)) {
      hourlyUv[i] = startVal;

      // 끝값도 유효하다면, 그 사이를 보간합니다.
      if (!isNaN(endVal)) {
        const difference = endVal - startVal;
        const step = difference / 3.0;
        hourlyUv[i + 1] = parseFloat((startVal + step).toFixed(2));
        hourlyUv[i + 2] = parseFloat((startVal + step * 2).toFixed(2));
      } else {
        // 끝값이 유효하지 않다면, 시작값으로 이후 2시간을 채웁니다.
        hourlyUv[i + 1] = startVal;
        hourlyUv[i + 2] = startVal;
      }
    }
  }
  return hourlyUv;
}


export const fetchUvIndexData = async (areaNo = '4117300000') => { 
  const now = new Date();
  let baseDate = new Date();
  let baseHour = '';
  const currentHour = now.getHours();

  if (currentHour < 6) {
    baseDate.setDate(baseDate.getDate() - 1);
    baseHour = '18';
  } else if (currentHour < 18) {
    baseHour = '06';
  } else {
    baseHour = '18';
  }

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  const timeString = `${year}${month}${day}${baseHour}`;
  
  const uvBaseDate = new Date(`${year}-${month}-${day}T${baseHour}:00:00`);

  const requestUrl = `${API_BASE_URL}?serviceKey=${API_KEY}&pageNo=1&numOfRows=10&dataType=JSON&areaNo=${areaNo}&time=${timeString}`;

  try {
    const response = await fetch(requestUrl);
    // ❗ response.ok가 아닐 때도 에러를 던지도록 수정
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const textResponse = await response.text();
    const data = JSON.parse(textResponse);
    
    if (data.response?.body?.items?.item) {
      const uvData = data.response.body.items.item[0];
      const interpolatedData = interpolateUvData(uvData);
      
      return { hourlyUv: interpolatedData, uvBaseDate: uvBaseDate };
    } else {
      console.error("자외선 API 데이터 없음:", textResponse);
      return null;
    }
  } catch (error) {
    // ❗ 실패 시 에러를 더 자세하게 출력
    console.error("❌ 자외선 API fetch 실패:", error);
    return null;
  }
};