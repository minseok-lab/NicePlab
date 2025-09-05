// api/uvApi.js

// --- 1. Import Section ---
// 1) api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 2) 내부 모듈 (Constants, Utils)
import { API_ENDPOINTS, KMA_UV_API_KEY } from '../constants';
import { interpolateUvData } from '../utils';

/**
 * 기능: 특정 지역의 자외선 지수 예보를 기상청 API를 통해 가져옵니다.
 * @param {string} areaNo - 지역번호 (기본값: 안양시)
 * @returns {Promise<Object|null>} - 시간별 UV 지수와 기준 시간을 포함하는 객체 또는 실패 시 null
 */
export const fetchUvIndexForcast = async (areaNo = '4117300000') => {
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
  console.log(`[자외선 예보 API] ➡️ 요청 시작: Time=${timeString}`);
  const requestUrl = `${API_ENDPOINTS.KMA_UV}?serviceKey=${KMA_UV_API_KEY}&pageNo=1&numOfRows=10&dataType=JSON&areaNo=${areaNo}&time=${timeString}`;

  const data = await apiClient(requestUrl, '자외선 지수');

  if (data?.response?.body?.items?.item) {
    console.log(
      `[자외선 예보 API] ✅ 요청 성공: ${timeString} 데이터 수신 완료.`,
    );
    const uvData = data.response.body.items.item[0];

    const interpolatedData = interpolateUvData(uvData, parseInt(baseHour, 10));

    return { hourlyUv: interpolatedData, uvBaseDate: uvBaseDate };
  } else {
    console.error('자외선 API 데이터가 없거나 형식이 올바르지 않습니다.');
    return null;
  }
};

/**
 * 기능: 특정 지역의 '현재' 자외선 지수를 가져옵니다.
 * @param {string} areaNo - 지역번호 (기본값: 안양시)
 * @returns {Promise<number|null>} - 현재 시간의 자외선 지수 또는 실패 시 null
 */
export const fetchCurrentUvIndex = async (areaNo = '4117300000') => {
  console.log('[현재 자외선] ➡️ 조회 시작');
  // 1. 기존 예보 함수를 호출하여 시간별 데이터를 가져옵니다.
  const forecastData = await fetchUvIndexForcast(areaNo);

  // 2. 데이터가 유효한지 확인합니다.
  if (forecastData && forecastData.hourlyUv && forecastData.uvBaseDate) {
    // 3. 현재 시간을 얻어옵니다 (0-23).
    const now = new Date();
    const { uvBaseDate, hourlyUv } = forecastData;

    // 기준 시간으로부터 현재까지 몇 시간이 지났는지 계산합니다.
    const hoursSinceBase = Math.floor((now - uvBaseDate) / (1000 * 60 * 60));

    // ✨ [수정] 기준 시간의 시(hour)와 경과 시간을 더해 최종 키를 계산합니다.
    const finalKey = uvBaseDate.getHours() + hoursSinceBase;

    // --- 🐛 디버깅 로그 강화 ---
    console.log('--- [현재 자외선 디버깅] ---');
    console.log(`1. 현재 시간: ${now.toLocaleString()}`);
    console.log(`2. 예보 기준 시간: ${uvBaseDate.toLocaleString()}`);
    console.log(`3. 기준 시간으로부터 경과 시간: ${hoursSinceBase}시간`);
    console.log(
      `4. 계산된 최종 키: ${finalKey} (기준시간 ${uvBaseDate.getHours()} + 경과 ${hoursSinceBase})`,
    );
    console.log('--------------------------');

    // 계산된 키로 현재 자외선 지수를 찾습니다.
    const currentUvIndex = hourlyUv[finalKey];

    if (currentUvIndex !== undefined) {
      console.log(
        `[현재 자외선] ✅ 조회 성공: 현재 자외선 지수는 [${currentUvIndex}] 입니다.`,
      );
      return currentUvIndex;
    } else {
      console.error(
        `[현재 자외선] ❌ 에러: 계산된 시간(${hoursSinceBase}h)에 해당하는 자외선 데이터가 없습니다.`,
      );
      return null;
    }
  } else {
    console.error(
      '[현재 자외선] ❌ 에러: 예보 데이터를 가져오는 데 실패했습니다.',
    );
    return null;
  }
};
