// api/plabService.js

const API_BASE_URL = process.env.EXPO_PUBLIC_PLAB_API_URL;
const PLAB_DETAIL_API_BASE_URL = process.env.EXPO_PUBLIC_PLAB_DETAIL_API_URL;

async function fetchAllPagesForDate(dateString, regionId) {
  // ... (이 함수는 변경 없음) ...
  let requestUrl = `${API_BASE_URL}?ordering=schedule&sch=${dateString}&region=${regionId}&page_size=100`;
  let matchesForDate = [];

  while (requestUrl) {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      console.warn(`Warning: Failed to fetch data for date ${dateString}. Status: ${response.status}`);
      return [];
    }
    const data = await response.json();
    matchesForDate = matchesForDate.concat(data.results);
    requestUrl = data.next;
  }
  return matchesForDate;
}

// *** 수정된 부분: city 대신 cities 배열을 받습니다. ***
export const fetchPlabMatches = async (weatherList, regionId, cities) => {
  if (!weatherList || weatherList.length === 0) return [];

  const uniqueDates = [...new Set(weatherList.map(item => {
    const date = new Date(item.dt * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }))];

  try {
    const promises = uniqueDates.map(dateString => fetchAllPagesForDate(dateString, regionId));
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
  console.log("--- 상세 매치 정보 요청 ---");
  console.log("BASE URL:", PLAB_DETAIL_API_BASE_URL);
  console.log("Match ID:", matchId);
  // 💡 --- 여기가 수정된 부분입니다 --- 💡
  // 직접 찾아내신 정확한 API 주소로 교체했습니다.
  const requestUrl = `${PLAB_DETAIL_API_BASE_URL}${matchId}/`;
  console.log("최종 요청 주소:", requestUrl);
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      // 404 오류 등이 발생하면 여기서 에러를 발생시킵니다.
      throw new Error(`Failed to fetch match details. Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching details for match ${matchId}:`, error);
    return null;
  }
};
