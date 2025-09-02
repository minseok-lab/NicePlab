// components/SeasonDecision.js

import { fetchPastTemperature } from '../api';
import { getSeason } from '../utils';
import { getWeatherLocationInfo } from '../utils'; 

/**
 * 기상청 과거 데이터를 조회하고 현재 계절을 판단하여 문자열로 반환합니다.
 * @param {string} stationId - 관측소 지점 번호 (기본값: '108' 서울)
 * @returns {Promise<string|null>} - 성공 시 "봄", "여름", "가을", "겨울" 중 하나, 실패 시 null을 반환하는 프로미스
 */
export const determineCurrentSeason = async () => { // ⭐ 파라미터 stationId 제거
  try {
    // 1. '현재 위치'의 모든 지역 정보(stationId 포함)를 가져옵니다.
    const locationInfo = await getWeatherLocationInfo("현재 위치");

    // 2. locationInfo와 stationId가 유효한지 확인합니다.
    if (!locationInfo || !locationInfo.stationId) {
      console.error("SeasonDecision: 관측소 ID를 포함한 위치 정보를 가져오지 못했습니다.");
      return null;
    }
    
    // 3. 동적으로 얻은 stationId를 사용하여 과거 기온 데이터를 요청합니다.
    const pastTempData = await fetchPastTemperature(locationInfo.stationId);

    // 4. API 호출 성공 및 데이터 존재 여부 확인
    if (pastTempData && pastTempData.list) {
      // 5. getSeason 유틸리티로 계절 판단
      const season = getSeason(pastTempData.list);
      console.log(`[계절 판단] ✅ 계절 판단 성공: ${season} 가중치를 사용합니다.`);
      return season;
    } else {
      console.error("SeasonDecision: 기온 데이터가 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("SeasonDecision: 계절을 판단하는 중 오류가 발생했습니다.", error);
    return null;
  }
};