// api/weatherForcastApi.js

// api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 로컬 함수 대신 공용 URL 빌더를 import 합니다.
import { buildKmaApiUrl } from '../utils';

// --- Main Export Function ---

/**
 * 기상청 단기예보 데이터를 안정적으로 가져옵니다.
 * API 지연 시 자동으로 이전 예보를 조회하는 로직이 포함되어 있습니다.
 * @param {object} grid - {nx, ny} 좌표
 * @param {string} locationName - 화면에 표시될 지역 이름
 * @returns {object|null} - 성공 시 { list, city } 객체, 실패 시 null
 */
export const fetchKmaWeatherForcast = async (
  grid,
  locationName = '현재 위치',
) => {
  console.log('[날씨 예보 API] ➡️ 최신 예보 조회를 시작합니다.');

  // 1. 가장 최신 발표 시간을 기준으로 API 요청 시도
  const latest = getShortTermBaseDateTime(new Date());
  let weatherList = await fetchAndParseShortTermData(grid, latest);

  // 2. 만약 최신 데이터가 없다면 (지연 발생), 3시간 전 예보로 다시 요청
  if (!weatherList) {
    console.warn(
      `[날씨 예보 API] ⚠️ 최신 예보(${latest.baseTime}) 실패. 이전 예보로 재시도합니다.`,
    );
    const previousTime = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    const previous = getShortTermBaseDateTime(previousTime);
    weatherList = await fetchAndParseShortTermData(grid, previous);
  }

  if (!weatherList) {
    console.error('[날씨 예보 API] ❌ 데이터를 가져오는데 최종 실패했습니다.');
    return null;
  }

  // 하드코딩된 이름 대신 인자로 받은 locationName 사용
  return { list: weatherList, city: { name: locationName } };
};

/**
 * '초단기예보' API를 호출하여 현재 시간의 하늘상태(SKY) 값을 가져옵니다.
 */
export const fetchCurrentSkyCondition = async grid => {
  const { baseDate, baseTime } = getUltraShortTermBaseDateTime();
  // ✨ 변경점: 공용 빌더를 사용하여 초단기예보 URL을 생성합니다.
  const url = buildKmaApiUrl('ULTRA_SHORT_TERM', { grid, baseDate, baseTime });

  console.log(
    `[SKY 정보 API] ➡️ 요청 시작: BaseDate=${baseDate}, BaseTime=${baseTime}`,
  );
  const data = await apiClient(url, { apiName: '기상청 초단기예보(SKY)' });

  const skyItem = data?.response?.body?.items?.item?.find(
    item => item.category === 'SKY',
  );

  if (skyItem) {
    const skyValue = Number(skyItem.fcstValue);
    console.log(
      `[SKY 정보 API] ✅ 요청 성공: 현재 SKY 값은 [${skyValue}] 입니다.`,
    );
    return skyValue;
  }

  console.error('[SKY 정보 API] ❌ SKY 값을 가져오는 데 실패했습니다.');
  return null;
};

// --- Helper Functions ---

/**
 * ✨ 개선: 단기예보 API 요청에 필요한 base_date와 base_time을 간결하게 계산합니다.
 */
function getShortTermBaseDateTime(dateObj) {
  let baseDateObj = new Date(dateObj);
  const currentHours = baseDateObj.getHours();
  const currentMinutes = baseDateObj.getMinutes();

  // 기상청 API는 새벽 2시 10분 이후부터 당일 예보를 제공합니다.
  if (currentHours < 2 || (currentHours === 2 && currentMinutes < 10)) {
    baseDateObj.setDate(baseDateObj.getDate() - 1);
  }

  const baseDate = `${baseDateObj.getFullYear()}${(baseDateObj.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${baseDateObj.getDate().toString().padStart(2, '0')}`;

  const announcementTimes = [
    '0200',
    '0500',
    '0800',
    '1100',
    '1400',
    '1700',
    '2000',
    '2300',
  ];

  // 현재 시간보다 이르거나 같은 발표 시간 중 가장 마지막 시간을 찾습니다.
  // 예: 현재 09:30 -> '0800' 반환
  const baseTime =
    announcementTimes.findLast(time => {
      const announcementTotalMinutes =
        parseInt(time.substring(0, 2), 10) * 60 + 10; // 발표시간 +10분
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      return currentTotalMinutes >= announcementTotalMinutes;
    }) || '2300'; // 만약 새벽 2시 10분 이전이면 '2300'이 됩니다.

  return { baseDate, baseTime };
}

/**
 * 단기예보 API를 호출하고 데이터를 파싱합니다.
 */
async function fetchAndParseShortTermData(grid, { baseDate, baseTime }) {
  // ✨ 변경점: 공용 빌더를 사용하여 단기예보 URL을 생성합니다.
  const url = buildKmaApiUrl('SHORT_TERM', { grid, baseDate, baseTime });

  console.log(
    `[날씨 예보 API] ➡️ 요청: BaseDate=${baseDate}, BaseTime=${baseTime}`,
  );
  const data = await apiClient(url, { apiName: '기상청 단기예보' });

  if (data?.response?.body?.items?.item) {
    console.log(
      `[날씨 예보 API] ✅ 성공: ${baseDate} ${baseTime} 데이터 수신 완료.`,
    );
    return parseKmaData(data.response.body.items.item);
  } else {
    console.warn(
      `[날씨 예보 API] ⚠️ ${baseDate} ${baseTime} 예보 데이터 없음. 응답: ${data?.response?.header?.resultMsg}`,
    );
    return null;
  }
}

/**
 * API 원본 데이터를 앱에서 사용하기 좋은 형태로 가공합니다. (변경 없음)
 */
function parseKmaData(items) {
  const weatherDataByTime = {};
  items.forEach(item => {
    const timeKey = `${item.fcstDate}${item.fcstTime}`;
    if (!weatherDataByTime[timeKey]) {
      const { fcstDate, fcstTime } = item;
      weatherDataByTime[timeKey] = {
        dt:
          new Date(
            `${fcstDate.slice(0, 4)}-${fcstDate.slice(4, 6)}-${fcstDate.slice(
              6,
              8,
            )}T${fcstTime.slice(0, 2)}:00:00`,
          ).getTime() / 1000,
      };
    }
    const categoryMap = {
      TMP: 'temp',
      POP: 'pop',
      PTY: 'pty',
      REH: 'humidity',
      SKY: 'sky',
      WSD: 'wind_speed',
    };
    if (categoryMap[item.category]) {
      weatherDataByTime[timeKey][categoryMap[item.category]] = Number(
        item.fcstValue,
      );
    }
  });
  return Object.values(weatherDataByTime);
}

/**
 * '초단기예보' API 요청에 필요한 base_date와 base_time을 계산합니다. (변경 없음)
 */
function getUltraShortTermBaseDateTime() {
  let now = new Date();
  if (now.getMinutes() < 45) {
    // 45분 이전에 요청 시 한 시간 전 데이터 사용
    now.setHours(now.getHours() - 1);
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  return { baseDate: `${year}${month}${day}`, baseTime: `${hours}30` };
}
