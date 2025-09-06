// utils/kmaApiUrlBuilder.js

import {
  API_ENDPOINTS,
  KMA_FORCAST_WEATHER_API_KEY,
  KMA_LIVE_WEATHER_API_KEY,
} from '../constants';

/**
 * @typedef {'LIVE' | 'SHORT_TERM' | 'ULTRA_SHORT_TERM'} KmaApiType
 */

/**
 * 기상청 API 종류와 파라미터에 따라 요청 URL을 생성합니다.
 * @param {KmaApiType} type - 요청할 API의 종류
 * @param {object} params - { grid, baseDate, baseTime }
 * @returns {string} 완성된 API 요청 URL
 */
export const buildKmaApiUrl = (type, params) => {
  const { grid, baseDate, baseTime } = params;

  let endpoint = '';
  let serviceKey = '';

  // API 종류에 따라 엔드포인트와 서비스 키를 설정합니다.
  switch (type) {
    case 'LIVE':
      endpoint = API_ENDPOINTS.KMA_LIVE_WEATHER;
      serviceKey = KMA_LIVE_WEATHER_API_KEY;
      break;
    case 'SHORT_TERM':
      endpoint = API_ENDPOINTS.KMA_FORCAST_WEATHER;
      serviceKey = KMA_FORCAST_WEATHER_API_KEY;
      break;
    case 'ULTRA_SHORT_TERM':
      endpoint = API_ENDPOINTS.KMA_ULTRA_SHORT_TERM_FORCAST_WEATHER;
      serviceKey = KMA_FORCAST_WEATHER_API_KEY; // 단기예보와 같은 키를 사용
      break;
    default:
      throw new Error(`[buildKmaApiUrl] 유효하지 않은 API 타입입니다: ${type}`);
  }

  const commonParams = `serviceKey=${serviceKey}&pageNo=1&numOfRows=1000&dataType=JSON&nx=${grid.nx}&ny=${grid.ny}`;
  return `${endpoint}?${commonParams}&base_date=${baseDate}&base_time=${baseTime}`;
};
