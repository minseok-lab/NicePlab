// api/weatherLiveApi.js

// api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 로컬 함수 대신 공용 URL 빌더를 import 합니다.
import { buildKmaApiUrl } from '../utils/kmaApiUrlBuilder';

/**
 * 기상청 초단기실황 데이터를 가져옵니다.
 * @param {object} grid - {nx, ny} 좌표
 * @returns {Promise<object|null>} - 성공 시 가공된 현재 날씨 객체, 실패 시 null
 */
export const fetchKmaLiveWeather = async grid => {
  const { baseDate, baseTime } = getApiBaseDateTimeForLive();

  // ✨ 변경점: 중앙화된 헬퍼 함수를 사용하여 URL을 생성합니다.
  const requestUrl = buildKmaApiUrl('LIVE', { grid, baseDate, baseTime });

  console.log(
    `[실황 날씨 API] ➡️ 요청 시작: BaseDate=${baseDate}, BaseTime=${baseTime}`,
  );
  const data = await apiClient(requestUrl, { apiName: '기상청 초단기실황' });

  if (data?.response?.body?.items?.item) {
    console.log(
      `[실황 날씨 API] ✅ 요청 성공: ${baseDate} ${baseTime} 데이터 수신 완료.`,
    );
    return parseKmaLiveData(data.response.body.items.item);
  } else {
    console.error(
      '실황 데이터를 가져오는데 실패했습니다.',
      data?.response?.header?.resultMsg,
    );
    return null;
  }
};

/**
 * 초단기실황 API 요청에 필요한 현재 base_date와 base_time을 계산합니다.
 * (매시 30분 이후에 이전 시간 데이터 요청)
 */
function getApiBaseDateTimeForLive() {
  let now = new Date();
  let minutes = now.getMinutes();

  // API 데이터는 보통 30-40분 후에 생성되므로, 안정적으로 한 시간 전 데이터를 요청합니다.
  if (minutes < 45) {
    now.setHours(now.getHours() - 1);
  }

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const baseTime = String(now.getHours()).padStart(2, '0') + '00';

  return { baseDate: `${year}${month}${day}`, baseTime };
}

/**
 * 초단기실황 API 원본 데이터를 앱에서 사용하기 좋은 형태로 가공합니다.
 * @param {Array} items - API 응답의 item 배열
 * @returns {object} - 현재 날씨 정보를 담은 객체
 */
function parseKmaLiveData(items) {
  const liveWeather = {};

  const categoryMap = {
    T1H: 'temp', // 기온
    RN1: 'rainfall', // 1시간 강수량
    PTY: 'pty', // 강수형태
    REH: 'humidity', // 습도
    VEC: 'wind_dir', // 풍향
    WSD: 'wind_speed', // 풍속
  };

  items.forEach(item => {
    const { category, obsrValue } = item; // 'obsrValue' 사용
    if (categoryMap[category]) {
      liveWeather[categoryMap[category]] = Number(obsrValue);
    }
  });

  return liveWeather;
}
