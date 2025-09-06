// api/airQualityApi.js

// --- 1. Import Section ---
// 1) api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 2) 내부 모듈 (constants)
import { API_ENDPOINTS, AIR_QUALITY_API_KEY } from '../constants';
import { REGION_NAME_MAP } from '../constants';

/**
 * 기능: 특정 오염물질(미세/초미세)의 예보 등급을 파싱하는 헬퍼 함수
 */
const fetchAndParseGrade = async (informCode, sidoName) => {
  const now = new Date();
  const searchDate = new Date(now);

  if (now.getHours() < 17) {
    searchDate.setDate(searchDate.getDate() - 1);
  }

  const dateString = `${searchDate.getFullYear()}-${String(
    searchDate.getMonth() + 1,
  ).padStart(2, '0')}-${String(searchDate.getDate()).padStart(2, '0')}`;
  const apiRegionName = REGION_NAME_MAP[sidoName] || sidoName;

  // URLSearchParams를 사용하여 URL 생성
  const baseUrl = API_ENDPOINTS.AIR_QUALITY_FORCAST;
  const params = new URLSearchParams({
    serviceKey: AIR_QUALITY_API_KEY,
    returnType: 'json',
    numOfRows: '100',
    pageNo: '1',
    searchDate: dateString,
    InformCode: informCode,
  });
  const requestUrl = `${baseUrl}?${params.toString()}`;

  console.log(`😷 [미세먼지 예보] ➡️ ${informCode} 미세먼지 데이터 조회 시작`);
  console.log(`😷 [미세먼지 예보] ➡️ 조회 지역: ${sidoName}`);

  // ✨ try-catch 블록 대신 apiClient를 사용합니다.
  const data = await apiClient(requestUrl, `미세먼지 ${informCode}`);

  if (data?.response?.body?.items?.length > 0) {
    const dailyForecast = data.response.body.items.find(item =>
      item.dataTime?.includes('17시'),
    );

    if (dailyForecast) {
      const grades = dailyForecast.informGrade.split(',').map(s => s.trim());
      for (const gradeInfo of grades) {
        const parts = gradeInfo.split(' : '); // ' : ' 기준으로 지역과 등급 분리
        if (parts.length === 2) {
          const region = parts[0].trim();
          const grade = parts[1].trim();

          if (region === apiRegionName) {
            console.log(
              `😷 [미세먼지 예보] '${sidoName}' 지역의 예보 등급 ➡️`,
              grade,
            );
            console.log(`😷 [미세먼지 예보] ✅ ${informCode} 조회 성공`);
            return grade; // 일치하는 지역을 찾으면 바로 등급을 반환
          }
        }
      }
    }
  }
  console.log(`😷 [미세먼지 예보] ❌ ${informCode} 조회 실패: 데이터 없음`);
  return '정보없음';
};

/**
 * 기능: 미세먼지와 초미세먼지 예보를 모두 조회합니다.
 */
export const fetchAirQualityForcast = async (sidoName = '경기') => {
  const [pm10Grade, pm25Grade] = await Promise.all([
    fetchAndParseGrade('PM10', sidoName),
    fetchAndParseGrade('PM25', sidoName),
  ]);

  // pm10, pm25 둘 다 유효한 값일 때만 객체를 반환, 아니면 null 반환
  if (pm10Grade && pm25Grade) {
    return {
      pm10: pm10Grade,
      pm25: pm25Grade,
    };
  }
  return null;
};

/**
 * 기능: 특정 측정소의 현재 미세먼지/초미세먼지 농도를 조회합니다.
 * @param {string} stationName - 측정소 이름 (예: '종로구')
 * @returns {Promise<object|null>} - 현재 미세먼지/초미세먼지 정보 또는 null
 */
export const fetchCurrentAirQuality = async (stationName = '종로구') => {
  // URLSearchParams를 사용하여 URL 생성
  const baseUrl = API_ENDPOINTS.AIR_QUALITY_LIVE;
  const params = new URLSearchParams({
    serviceKey: AIR_QUALITY_API_KEY,
    returnType: 'json',
    numOfRows: '1',
    pageNo: '1',
    stationName: stationName, // URLSearchParams가 자동으로 인코딩 처리
    dataTerm: 'DAILY',
    ver: '1.3',
  });
  const requestUrl = `${baseUrl}?${params.toString()}`;

  console.log(
    `😷 [현재 미세먼지] ➡️ 데이터 조회 시작, 조회 측정소: ${stationName}`,
  );

  const data = await apiClient(requestUrl, `현재 미세먼지`);

  // API 응답에서 가장 최신 데이터를 가져옵니다.
  const latestData = data?.response?.body?.items?.[0];

  if (latestData) {
    // 데이터 유효성 검사 로직 추가
    // pm10과 pm25 값이 모두 '-' (측정값 없음)이거나 '통신장애' 플래그가 있으면
    // 유효하지 않은 데이터로 간주하고 실패 처리합니다.
    if (
      (latestData.pm10Value === '-' && latestData.pm25Value === '-') ||
      latestData.pm10Flag === '통신장애' ||
      latestData.pm25Flag === '통신장애'
    ) {
      console.log(
        `😷 [현재 미세먼지] ❌ 조회 실패: '${stationName}' 측정소의 데이터가 유효하지 않습니다 (점검 또는 통신장애).`,
      );
      // ❗️ 실패로 처리하여 다음 측정소를 시도하도록 null 반환
      return null;
    }

    // 유효성 검사를 통과한 경우에만 데이터를 반환합니다.
    console.log(`😷 [현재 미세먼지] ✅ 조회 성공`);
    return {
      pm10Value: latestData.pm10Value,
      pm25Value: latestData.pm25Value,
      dataTime: latestData.dataTime,
    };
  } else {
    console.log(`😷 [현재 미세먼지] ❌ 조회 실패: 데이터 없음`);
    return null;
  }
};
