// api/airQualityService.js

// api 호출 경로를 불러옵니다.
import { API_ENDPOINTS, AIR_QUALITY_API_KEY } from '../constants/links';
import { REGION_NAME_MAP } from '../constants/airKoreaRegion';

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
  const apiRegionName = REGION_NAME_MAP[sidoName] || sidoName;
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

    // 2. 저장된 변수를 사용해 JSON으로 파싱합니다.
    const data = JSON.parse(rawTextResponse);
    
    if (data.response?.body?.items && data.response.body.items.length > 0) {
      
      const dailyForecast = data.response.body.items.find(item => item.dataTime && item.dataTime.includes('17시'));

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
export const fetchAirQualityForcast = async (sidoName = '경기') => {
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