// api/plabService.js

// --- 1. Import Section ---
// 1) api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 2) 내부 모듈 (contsants)
import { PLAB_API_URL, PLAB_DETAIL_API_URL } from '../constants/links';


async function fetchAllPagesForDate(dateString, regionId, cities) {
  // ... (이 함수는 변경 없음) ...
  let requestUrl = `${PLAB_API_URL}?ordering=schedule&sch=${dateString}&region=${regionId}&page_size=100`;
  let matchesForDate = [];

  while (requestUrl) {
    // ✨ apiClient가 fetch와 기본 에러 처리를 담당합니다.
    const data = await apiClient(requestUrl, '플랩 매치 목록');

    // 데이터 로드에 실패하면 루프를 중단합니다.
    if (!data) {
      console.warn(`Warning: ${dateString} 날짜의 플랩 매치 페이지를 가져오지 못했습니다.`);
      break; 
    }
    
    matchesForDate = matchesForDate.concat(data.results);
    requestUrl = data.next; // 다음 페이지 URL로 업데이트
  }
  return matchesForDate;
}

// *** 수정된 부분: city 대신 cities 배열을 받습니다. ***
export const fetchPlabMatches = async (weatherList, regionId, cities) => {
  console.log(`⚽️ [플랩 API] 요청 지역: regionId=${regionId}, cities=${cities.join(', ')}`);
  if (!weatherList || weatherList.length === 0) return [];

  const uniqueDates = [...new Set(weatherList.map(item => {
    const date = new Date(item.dt * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }))];

  try {
    const promises = uniqueDates.map(dateString => fetchAllPagesForDate(dateString, regionId, cities));
    const resultsByDate = await Promise.all(promises);
    const allMatches = resultsByDate.flat();

    const formattedAndFiltered = allMatches
      .filter(match => {
        const isCityMatch = cities.includes(match.area_name);
        // 'available'과 'hurry' 상태를 모두 허용합니다.
        const isStatusMatch = ['available', 'hurry'].includes(match.apply_status); 
        
        return isCityMatch && isStatusMatch;
      })
      .map(match => { // 이 map 부분은 반드시 필요합니다.
        const startTime = new Date(match.schedule);
        const hours = String(startTime.getHours()).padStart(2, '0');
        const minutes = String(startTime.getMinutes()).padStart(2, '0');
        
        return {
          ...match,
          formatted_time: `${hours}:${minutes}`
        };
      });

    return formattedAndFiltered;

  } catch (error) {
    console.error("Failed to fetch plab matches:", error);
    return []; 
  }
};

/**
 * 특정 매치 ID를 사용하여 해당 매치의 모든 상세 정보를 가져옵니다.
 * @param {number} matchId - 상세 정보를 조회할 매치의 ID
 * @returns {object|null} 'applys' 배열이 포함된 상세 매치 정보 또는 실패 시 null
 */
export const fetchPlabMatchDetails = async (matchId) => {

  const requestUrl = `${PLAB_DETAIL_API_URL}${matchId}/`;

  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      // 404 오류 등이 발생하면 여기서 에러를 발생시킵니다.
      throw new Error(`Failed to fetch match details. Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
};
