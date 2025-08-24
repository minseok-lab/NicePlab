// api/airQualityService.js

const API_KEY = process.env.EXPO_PUBLIC_KMA_AIR_API_KEY;
const API_BASE_URL = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMinuDustFrcstDspth';

/**
 * 기능: 특정 오염물질(미세/초미세)의 예보 등급을 파싱하는 헬퍼 함수
 */
const fetchAndParseGrade = async (informCode, sidoName) => {
  // --- ✨ 핵심 수정 부분 시작 ---
  const now = new Date();
  const searchDate = new Date(now); // 직접 수정을 피하기 위해 날짜 객체 복사

  // 현재 시간이 17시(오후 5시) 이전이면, 조회 날짜를 어제로 설정
  if (now.getHours() < 17) {
    searchDate.setDate(searchDate.getDate() - 1);
  }

  // API 요청에 사용할 날짜 문자열(YYYY-MM-DD) 생성
  const dateString = `${searchDate.getFullYear()}-${String(searchDate.getMonth() + 1).padStart(2, '0')}-${String(searchDate.getDate()).padStart(2, '0')}`;
  // --- ✨ 핵심 수정 부분 끝 ---

  const requestUrl = `${API_BASE_URL}?serviceKey=${API_KEY}&returnType=json&numOfRows=100&pageNo=1&searchDate=${dateString}&InformCode=${informCode}`;

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`Network response was not ok for ${informCode}`);
  }
  const data = await response.json();
  
  if (data.response?.body?.items && data.response.body.items.length > 0) {
    const items = data.response.body.items;
    
    // API 응답 리스트에서 '17시' 발표 자료를 찾습니다.
    const dailyForecast = items.find(item => item.dataTime && item.dataTime.includes('17시'));

    if (dailyForecast) {
      const grades = dailyForecast.informGrade.split(',').map(s => s.trim());
      const regionGrade = grades.find(g => g.startsWith(sidoName));
      return regionGrade ? regionGrade.split(' : ')[1] : '정보없음';
    }
  }
  return '정보없음';
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