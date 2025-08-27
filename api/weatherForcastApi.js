// api/weatherForcastApi.js

// api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 2) 내부 모듈 (contsants)
import { API_ENDPOINTS, KMA_WEATHER_API_KEY } from '../constants/links';


// --- Main Export Function ---

/**
 * 기상청 단기예보 데이터를 안정적으로 가져옵니다.
 * API 지연 시 자동으로 이전 예보를 조회하는 로직이 포함되어 있습니다.
 * @param {object} grid - {nx, ny} 좌표
 * @returns {object|null} - 성공 시 { list, city } 객체, 실패 시 null
 */
export const fetchKmaWeatherForcast = async (grid) => {
  const now = new Date();

  // 1. 가장 최신 발표 시간을 기준으로 API 요청 시도
  const latest = getApiBaseDateTime(now);
  console.log(`1차 시도: 가장 최신 예보(${latest.baseTime})를 요청합니다.`);
  let weatherList = await fetchAndParseData(grid, latest.baseDate, latest.baseTime);

  // 2. 만약 최신 데이터가 없다면 (지연 발생), 3시간 전 예보로 다시 요청
  if (!weatherList || weatherList.length === 0) {
    console.warn(`최신 예보(${latest.baseTime})를 가져오지 못했습니다. 이전 예보로 다시 시도합니다.`);
    const previousTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3시간 전
    const previous = getApiBaseDateTime(previousTime);
    
    weatherList = await fetchAndParseData(grid, previous.baseDate, previous.baseTime);
  }

  // 최종적으로 데이터 가져오기에 실패한 경우
  if (!weatherList || weatherList.length === 0) {
    console.error("데이터를 가져오는데 최종 실패했습니다.");
    return null;
  }

  return { list: weatherList, city: { name: '현재 위치' } };
};

// --- Helper Functions ---

/**
 * 주어진 Date 객체를 기준으로 API 요청에 필요한 base_date와 base_time을 계산합니다.
 * @param {Date} dateObj - 기준이 될 시간
 * @returns {{baseDate: string, baseTime: string}} YYYYMMDD, HHMM 형식의 객체
 */
function getApiBaseDateTime(dateObj) {
  const currentHours = dateObj.getHours();
  const currentMinutes = dateObj.getMinutes();

  let baseDateObj = new Date(dateObj);
  
  // 새벽 2시 10분 이전에는 기준 날짜를 어제로 설정
  if (currentHours < 2 || (currentHours === 2 && currentMinutes < 10)) {
    baseDateObj.setDate(baseDateObj.getDate() - 1);
  }

  const year = baseDateObj.getFullYear();
  const month = String(baseDateObj.getMonth() + 1).padStart(2, '0');
  const day = String(baseDateObj.getDate()).padStart(2, '0');
  const baseDate = `${year}${month}${day}`;
  
  // API 조회를 위한 base_time 계산 (가장 가까운 과거 시간)
  let baseTime = '2300';
  const announcementTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];

  // 현재 시간보다 작은 발표 시간 중 가장 마지막 시간을 찾습니다.
  for (const time of announcementTimes) {
    const announcementHour = parseInt(time.substring(0, 2), 10);
    if (currentHours > announcementHour || (currentHours === announcementHour && currentMinutes >= 10)) {
      baseTime = time;
    }
  }

  // 새벽 2시 10분 이전 예외 처리
  if (currentHours < 2 || (currentHours === 2 && currentMinutes < 10)) {
    baseTime = '2300';
  }
  
  return { baseDate, baseTime };
}

/**
 * 특정 base_date와 base_time으로 실제 API를 호출하고 데이터를 파싱합니다.
 * apiClient를 사용하여 리팩토링되었습니다.
 */
async function fetchAndParseData(grid, baseDate, baseTime) {
  const requestUrl = `${API_ENDPOINTS.KMA_WEATHER}?serviceKey=${KMA_WEATHER_API_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${grid.nx}&ny=${grid.ny}`;
  console.log(`[날씨 API] ➡️ 요청 시작: BaseDate=${baseDate}, BaseTime=${baseTime}`);
  // apiClient가 fetch, 에러 처리, JSON 파싱을 모두 담당합니다.
  const data = await apiClient(requestUrl, '기상청 단기예보');

  if (data?.response?.body?.items?.item) {
    console.log(`[날씨 API] ✅ 요청 성공: ${baseDate} ${baseTime} 데이터 수신 완료.`);
    return parseKmaData(data.response.body.items.item);
  } else {
    // API 호출은 성공했지만, 내용이 없는 경우
    console.warn(`[${baseDate} ${baseTime}] 예보 데이터 없음. 응답:`, data?.response?.header?.resultMsg);
    return null;
  }
}

/**
 * API 원본 데이터를 앱에서 사용하기 좋은 형태로 가공합니다.
 * @param {Array} items - API 응답의 item 배열
 * @returns {Array} - 시간대별로 그룹화된 날씨 데이터 배열
 */
function parseKmaData(items) {
  const weatherDataByTime = {};

  items.forEach(item => {
    const { fcstDate, fcstTime, category, fcstValue } = item;
    const timeKey = `${fcstDate}${fcstTime}`;

    if (!weatherDataByTime[timeKey]) {
      weatherDataByTime[timeKey] = {
        date: fcstDate,
        time: fcstTime,
        dt: new Date(`${fcstDate.slice(0, 4)}-${fcstDate.slice(4, 6)}-${fcstDate.slice(6, 8)}T${fcstTime.slice(0, 2)}:00:00`).getTime() / 1000,
      };
    }

    const categoryMap = {
      'TMP': 'temp', 'POP': 'pop', 'PTY': 'pty',
      'REH': 'humidity', 'SKY': 'sky', 'WSD': 'wind_speed',
    };

    if (categoryMap[category]) {
      weatherDataByTime[timeKey][categoryMap[category]] = Number(fcstValue);
    }
  });

  return Object.values(weatherDataByTime);
}