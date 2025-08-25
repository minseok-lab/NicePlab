// api/airQualityService.js

// api 호출 경로를 불러옵니다.
import { API_ENDPOINTS, AIR_QUALITY_API_KEY } from '../constants/links';

/**
 * 앱에서 사용하는 전체 지역명(sidoName)을 AirKorea API 형식으로 변환합니다.
 * @param {string} sidoName - 예: '충청남도', '경기도'
 * @returns {string} - 예: '충남', '경기'
 */
function getApiRegionName(sidoName) {
  switch (sidoName) {
    case '충청남도':
      return '충남';
    case '충청북도':
      return '충북';
    case '경기도':
      return '경기'; // API는 '경기' 전체를 한번에 검색 가능
    case '경상남도':
      return '경남';
    case '경상북도':
      return '경북';
    case '전라남도':
      return '전남';
    case '전라북도':
      return '전북';
    // 참고: API는 '서울', '부산' 등 광역시는 전체 이름으로 검색 가능
    default:
      return sidoName; // 특별한 변환이 필요 없으면 원래 이름을 반환
  }
}

/**
 * 기능: 특정 오염물질(미세/초미세)의 예보 등급을 파싱하는 헬퍼 함수
 */
// api/airQualityApi.js

const fetchAndParseGrade = async (informCode, sidoName) => {
  const now = new Date();
  const searchDate = new Date(now);

  if (now.getHours() < 17) {
    searchDate.setDate(searchDate.getDate() - 1);
  }

  const dateString = `${searchDate.getFullYear()}-${String(searchDate.getMonth() + 1).padStart(2, '0')}-${String(searchDate.getDate()).padStart(2, '0')}`;
  const apiRegionName = getApiRegionName(sidoName);
  const requestUrl = `${API_ENDPOINTS.AIR_QUALITY}?serviceKey=${AIR_QUALITY_API_KEY}&returnType=json&numOfRows=100&pageNo=1&searchDate=${dateString}&InformCode=${informCode}`;

  console.log(`\n--- [${informCode}] 미세먼지 데이터 조회 시작 ---`);
  console.log(`1. 조회 지역: ${sidoName}`);

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    // 1. 서버의 응답을 텍스트로 먼저 읽어서 변수에 저장합니다.
    const rawTextResponse = await response.text();
    console.log('3. 서버 원본 응답:', rawTextResponse);

    // 2. 저장된 변수를 사용해 JSON으로 파싱합니다.
    const data = JSON.parse(rawTextResponse);
    
    if (data.response?.body?.items && data.response.body.items.length > 0) {
      const items = data.response.body.items;
      
      const dailyForecast = items.find(item => item.dataTime && item.dataTime.includes('17시'));
      console.log("4. '17시' 예보 데이터:", dailyForecast);

      if (dailyForecast) {
        const grades = dailyForecast.informGrade.split(',').map(s => s.trim());
        const regionGrade = grades.find(g => g.startsWith(apiRegionName));
        console.log(`5. '${sidoName}' 지역의 예보 등급:`, regionGrade);
        
        console.log(`--- [${informCode}] 조회 성공 ---`);
        return regionGrade ? regionGrade.split(' : ')[1] : '정보없음';
      }
    }
    console.log(`--- [${informCode}] 조회 실패: 데이터 없음 ---`);
    return '정보없음';
  } catch (error) {
    console.error(`[${informCode}] processing error:`, error);
    throw error; 
  }
};

/**
 * 기능: 미세먼지와 초미세먼지 예보를 모두 조회합니다.
 */
export const fetchAirQualityData = async (sidoName = '경기') => {
  try {
    const [pm10Grade, pm25Grade] = await Promise.all([
      fetchAndParseGrade('PM10', sidoName),
      fetchAndParseGrade('PM25', sidoName)
    ]);

    return {
      pm10: pm10Grade, // 미세먼지 등급
      pm25: pm25Grade, // 초미세먼지 등급
    };

  } catch (error) {
    console.error("Failed to fetch Air Quality data:", error);
    return null;
  }
};