// api/pastTemperatureApi.js

// 1) 외부 모듈 (API 클라이언트)
import { apiClient } from './apiClient';

// 2) 내부 모듈 (상수)
import { API_ENDPOINTS, KMA_PAST_TEMPERATURE_API_KEY } from '../constants';

// --- Main Export Function ---

/**
 * 기상청 지상(ASOS) 관측소의 지난 10일간 일자료를 조회합니다.
 * @param {string | number} stationId - 관측소 지점 번호 (예: '108'은 서울)
 * @returns {object|null} - 성공 시 { list } 객체, 실패 시 null
 */
export const fetchPastTemperature = async (stationId = '108') => {
  console.log(
    `🌡️ [과거 기온 API] ➡️ 관측소 ID '${stationId}'로 조회를 시작합니다.`,
  );
  // 1. 조회할 날짜 범위 계산 (어제부터 10일 전까지)
  const { startDate, endDate } = getPastDateRange(15);

  console.log(
    `🌡️ [과거 기온 API] ➡️ 요청 시작: ${startDate}부터 ${endDate}까지 데이터를 요청합니다.`,
  );

  // 2. API를 통해 데이터 호출 및 파싱
  const pastData = await fetchAsosData(stationId, startDate, endDate);

  // 3. 결과 반환
  if (!pastData || pastData.length === 0) {
    console.error('🌡️ [과거 기온 API] ❌ 데이터를 가져오는데 실패했습니다.');
    return null;
  }

  console.log('🌡️ [과거 기온 API] ✅ 요청 성공: 데이터 수신 및 파싱 완료.');
  return { list: pastData };
};

// --- Helper Functions ---

/**
 * 조회할 과거 기간(최근 N일)을 YYYYMMDD 형식으로 계산합니다.
 * @param {number} daysAgo - 조회할 기간 (일)
 * @returns {{startDate: string, endDate: string}} 시작일과 종료일
 */
function getPastDateRange(daysAgo) {
  const today = new Date();
  const endDateObj = new Date(today);
  endDateObj.setDate(today.getDate() - 1); // 어제 날짜를 종료일로 설정

  const startDateObj = new Date(today);
  startDateObj.setDate(today.getDate() - daysAgo); // 10일 전

  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  return {
    startDate: formatDate(startDateObj),
    endDate: formatDate(endDateObj),
  };
}

/**
 * 특정 기간의 ASOS 데이터를 API로 호출하고 파싱합니다.
 * URLSearchParams를 사용하여 URL 생성 로직을 개선했습니다.
 * @param {string} stationId - 관측소 지점 ID
 * @param {string} startDate - 조회 시작일 (YYYYMMDD)
 * @param {string} endDate - 조회 종료일 (YYYYMMDD)
 * @returns {Promise<Array|null>} 파싱된 데이터 배열 또는 실패 시 null
 */
async function fetchAsosData(stationId, startDate, endDate) {
  const baseUrl = API_ENDPOINTS.KMA_ASOS_DAILY;

  // 파라미터를 객체로 관리하여 가독성과 유지보수성을 높입니다.
  const params = new URLSearchParams({
    serviceKey: KMA_PAST_TEMPERATURE_API_KEY,
    pageNo: '1',
    numOfRows: '15', // 15일치 데이터를 요청
    dataType: 'JSON',
    dataCd: 'ASOS',
    dateCd: 'DAY',
    startDt: startDate,
    endDt: endDate,
    stnIds: stationId,
  });

  const requestUrl = `${baseUrl}?${params.toString()}`;

  const data = await apiClient(requestUrl, { apiName: '기상청 ASOS 일자료' });

  if (data?.response?.body?.items?.item) {
    const parsedData = parseAsosData(data.response.body.items.item);
    console.log(
      `🌡️ [과거 기온 API] ➡️ 수신된 데이터 일수: ${parsedData.length}일`,
    );
    return parsedData;
  } else {
    console.warn(
      `🌡️ [과거 기온 API] ❌ 데이터 없음. 응답:`,
      data?.response?.header?.resultMsg,
    );
    return null;
  }
}

/**
 * ASOS API 원본 데이터를 앱에서 사용하기 좋은 형태로 가공합니다.
 * @param {Array} items - API 응답의 item 배열
 * @returns {Array} - 최고, 최저, 평균 기온을 포함한 날씨 데이터 배열
 */
function parseAsosData(items) {
  return items.map(item => ({
    date: item.tm, // 날짜 (YYYY-MM-DD)
    avgTemp: Number(item.avgTa), // 평균 기온
    minTemp: Number(item.minTa), // 최저 기온
    maxTemp: Number(item.maxTa), // 최고 기온
  }));
}
