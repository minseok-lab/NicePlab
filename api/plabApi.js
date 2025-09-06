// api/plabApi.js

// --- 1. Import Section ---
// 1) api 호출 경로를 불러옵니다.
import { apiClient } from './apiClient';

// 2) 내부 모듈 (contsants)
import { PLAB_API_URL, PLAB_DETAIL_API_URL } from '../constants';

/**
 * 특정 날짜와 지역 ID에 해당하는 모든 Plab 매치 페이지를 순회하며 가져옵니다.
 * @param {string} dateString - 'YYYY-MM-DD' 형식의 날짜 문자열
 * @param {number} regionId - Plab 지역 ID
 * @returns {Promise<Array>} 해당 날짜의 모든 매치 목록
 */
async function fetchAllPagesForDate(dateString, regionId) {
  let requestUrl = `${PLAB_API_URL}?ordering=schedule&sch=${dateString}&region=${regionId}&page_size=100`;
  let matchesForDate = [];
  let pageCount = 1; // ✨ 페이지 카운터 추가

  while (requestUrl) {
    // apiClient가 fetch와 기본 에러 처리를 담당합니다.
    const data = await apiClient(requestUrl, '플랩 매치 목록');

    // 데이터 로드에 실패하면 루프를 중단합니다.
    if (!data.results) {
      // data와 data.results의 존재 여부를 모두 확인
      console.warn(
        `⚽️ [Plab] Warning: ${dateString} 날짜의 페이지 ${pageCount}를 가져오지 못했거나 결과가 없습니다.`,
      );
      break;
    }

    // .push()와 전개 연산자를 사용해 메모리 효율성 개선
    matchesForDate.push(...data.results);
    const { next: nextUrl } = data;

    // 다음 페이지 URL이 현재 URL과 동일하면 루프를 강제로 중단하여 무한 루프를 방지합니다.
    if (nextUrl === requestUrl) {
      console.warn(
        `⚽️ [Plab] 다음 페이지 URL이 현재 URL과 동일하여 중단합니다: ${requestUrl}`,
      );
      break;
    }

    requestUrl = data.next; // 다음 페이지 URL로 업데이트
    pageCount++;
  }
  return matchesForDate;
}

/**
 * 날씨 예보 목록을 기반으로 추천 Plab 매치 목록을 가져옵니다.
 * @param {Array} weatherList - 날씨 예보 데이터 배열
 * @param {number} regionId - Plab 지역 ID
 * @param {Array<string>} cities - 필터링할 도시/지역 이름 배열
 * @returns {Promise<Array>} 필터링 및 포맷팅된 최종 매치 목록
 */
export const fetchPlabMatches = async (weatherList, regionId, cities) => {
  console.log(
    `⚽️ [Plab] 요청 지역: regionId=${regionId}, cities=${cities.join(', ')}`,
  );
  if (!weatherList || weatherList.length === 0) return [];

  // 1. 날씨 예보에서 중복되지 않는 날짜 목록을 추출합니다.
  const uniqueDates = [
    ...new Set(
      weatherList.map(
        item => new Date(item.dt * 1000).toISOString().split('T')[0],
      ),
    ),
  ];

  try {
    // 2. 각 날짜에 대해 모든 페이지의 매치 데이터를 병렬로 가져옵니다.
    const promises = uniqueDates.map(dateString =>
      fetchAllPagesForDate(dateString, regionId),
    );
    const resultsByDate = await Promise.all(promises);
    console.log(
      '⚽️ [Plab] 모든 날짜의 페이지 로딩 완료. 데이터 필터링을 시작합니다.',
    );

    // 3. 모든 날짜의 결과를 하나의 배열로 합칩니다.
    const allMatches = resultsByDate.flat();

    // 4. 지역, 신청 상태에 따라 필터링하고 필요한 형태로 가공합니다.
    const formattedAndFiltered = allMatches
      .filter(match => {
        const isCityMatch = cities.includes(match.area_name);
        // 'available'과 'hurry' 상태를 모두 허용합니다.
        const isStatusMatch = ['available', 'hurry'].includes(
          match.apply_status,
        );
        return isCityMatch && isStatusMatch;
      })
      .map(match => {
        // 이 map 부분은 반드시 필요합니다.
        const startTime = new Date(match.schedule);
        const hours = String(startTime.getHours()).padStart(2, '0');
        const minutes = String(startTime.getMinutes()).padStart(2, '0');

        return {
          ...match, // 매치 객체 정보에 얼리버드, 슈퍼서브, 티셔츠 여부 포함
          formatted_time: `${hours}:${minutes}`,
        };
      });
    console.log(
      `⚽️ [Plab] 최종 매치 데이터 처리 완료. ${formattedAndFiltered.length}개의 매치를 반환합니다.`,
    );
    return formattedAndFiltered;
  } catch (error) {
    console.error('⚽️ [Plab] 매치를 가져오는 데 실패했습니다:', error);
    return [];
  }
};

/**
 * 특정 매치 ID를 사용하여 해당 매치의 모든 상세 정보를 가져옵니다.
 * @param {number} matchId - 상세 정보를 조회할 매치의 ID
 * @returns {object|null} 'applys' 배열이 포함된 상세 매치 정보 또는 실패 시 null
 */
export const fetchPlabMatchDetails = async matchId => {
  const requestUrl = `${PLAB_DETAIL_API_URL}${matchId}/`;

  // 일관성을 위해 apiClient를 사용합니다.
  const data = await apiClient(requestUrl, { apiName: '플랩 매치 상세' });

  // apiClient가 에러 처리를 하고 실패 시 null을 반환하므로, 그대로 data를 반환합니다.
  return data;
};
