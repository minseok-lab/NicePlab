// api/uvApi.js

// --- 1. Import Section ---
// 1) api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 2) 내부 모듈 (Constants, Utils)
import { API_ENDPOINTS, KMA_UV_API_KEY } from '../constants';
import { interpolateUvData } from '../utils/formatters/uvForcastDataParser';

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

  // URLSearchParams를 사용하여 URL 생성
  const baseUrl = API_ENDPOINTS.KMA_UV;
  const params = new URLSearchParams({
    serviceKey: KMA_UV_API_KEY,
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    areaNo: areaNo,
    time: timeString,
  });
  const requestUrl = `${baseUrl}?${params.toString()}`;

  console.log(`😎 [자외선 예보 API] ➡️ 요청 시작: Time=${timeString}`);
  const data = await apiClient(requestUrl, { apiName: '자외선 지수' });

  if (data?.response?.body?.items?.item?.[0]) {
    console.log(
      `😎 [자외선 예보 API] ✅ 요청 성공: ${timeString} 데이터 수신 완료.`,
    );
    const uvData = data.response.body.items.item[0];
    const interpolatedData = interpolateUvData(uvData, parseInt(baseHour, 10));
    return { hourlyUv: interpolatedData, uvBaseDate: uvBaseDate };
  } else {
    console.error(
      '😎 [자외선 예보 API] ❌ 에러: 데이터가 없거나 형식이 올바르지 않습니다.',
    );
    return null;
  }
};
