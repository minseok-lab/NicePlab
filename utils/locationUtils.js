// utils/locationUtils.js

// --- 1. 위치 정보 관련 유틸리티 함수들 ---
import * as Location from 'expo-location'; // Expo 위치 정보 API
import { PLAB_REGIONS } from '../constants/plabRegion.js'; // PLAB 지역 그룹 데이터
import KMA_AREA_CODES from '../constants/kmaAreaCodes.json'; // 기상청 자외선 API 지역 코드를 불러옵니다.

// --- 2. 좌표 변환(위치 정보 -> 기상청 API)에 필요한 상수들
function convertGpsToGrid(lat, lon) {
    // 1) LCC DFS 좌표변환 (위경도 -> 격자) 공식
    const RE = 6371.00877; 
    const GRID = 5.0; 
    const SLAT1 = 30.0; 
    const SLAT2 = 60.0; 
    const OLON = 126.0; 
    const OLAT = 38.0; 
    const XO = 43; 
    const YO = 136; 
    const DEGRAD = Math.PI / 180.0;

    // 2) 계산에 필요한 값들을 미리 계산해둡니다.
    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    // 3) 공식에 따라 격자 좌표(nx, ny)를 계산합니다.
    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    // 4)위도(lat)와 경도(lon)를 격자 좌표(nx, ny)로 변환합니다.
    let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    
    // 최종 격자 좌표 계산
    const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return { nx, ny };
}

/**
 * 사용자의 격자 좌표(nx, ny)를 기반으로 kmaAreaCodes.json에서 가장 가까운 지역의
 * 행정구역코드(areaNo)를 찾습니다.
 * @param {object} grid - { nx: number, ny: number } 형태의 격자 좌표 객체
 * @returns {string} - 가장 근접한 지역의 행정구역코드
 */

// --- 3. kmaAreaCodes.json에서 가장 가까운 지역의 행정구역코드를 찾는 함수 ---
function findClosestAreaCode(grid) {
  let closestArea = null;
  let minDistance = Infinity;

  // 1) kmaAreaCodes.json 파일의 모든 지역을 순회합니다.
  for (const area of KMA_AREA_CODES) {
    // 2) 유효한 격자 X, Y 값이 있는 지역만 대상으로 합니다.
    if (area['격자 X'] && area['격자 Y']) {
      const dx = area['격자 X'] - grid.nx;
      const dy = area['격자 Y'] - grid.ny;
      // 3) 유클리드 거리를 계산합니다. (제곱근은 순위 비교에 불필요하므로 생략)
      const distance = dx * dx + dy * dy;

      // 4) 현재까지의 최소 거리보다 더 가까운 지역을 찾으면 업데이트합니다.
      if (distance < minDistance) {
        minDistance = distance;
        closestArea = area;
      }
    }
  }

  // 5) 가장 가까운 지역의 행정구역코드를 반환합니다. 찾지 못하면 기본값(안양시 동안구)을 사용합니다.
  return closestArea ? String(closestArea['행정구역코드']) : '4117300000';
}


/**
 * 사용자의 현재 위치를 기반으로 지역 정보를 반환합니다.
 * 서울특별시와 같은 광역/특별시의 주소 체계를 자동으로 처리합니다.
 */
// --- 4. 사용자의 현재 위치를 기반으로 지역 정보를 반환하는 함수 ---
export const getRegionIdFromLocation = async () => {
  // 1) 위치 권한 요청 및 현재 위치 가져오기
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('위치 정보 접근 권한이 거부되었습니다.');
    }
    
    // 2) 현재 위치의 위도, 경도 정보를 가져옵니다.
    const location = await Location.getCurrentPositionAsync({});
    const addresses = await Location.reverseGeocodeAsync(location.coords);
    
    // 3) 주소 정보에서 지역(시/도)과 도시(시/군/구) 정보를 추출합니다.
    if (addresses.length > 0) {
      const { region, city, district } = addresses[0];
      
      // [1] city가 null일 경우 district를 사용 (서울특별시 대응)
      const currentCity = city || district;

      if (region && currentCity) {
        // [2] '서울' vs '서울특별시' 와 같은 축약/전체 이름 및 '대전/세종' 같은 복합 이름을 모두 처리
        const foundGroup = PLAB_REGIONS.find(group => 
            group.area_group_name.split('/').some(name => region.startsWith(name.trim()))
        );

        // [3] 사용자의 위도, 경도 정보를 격자 좌표(nx, ny)로 변환하고, 가장 가까운 행정구역코드(areaNo)를 찾습니다.
        const grid = convertGpsToGrid(location.coords.latitude, location.coords.longitude);
        const areaNo = findClosestAreaCode(grid);

        // console.log("사용자 위치 기반 격자 좌표:", grid, "가장 가까운 행정구역코드:", areaNo);
        if (foundGroup) {
          // [4] '중구' 와 같이 '구'로 끝나는 경우를 처리하기 위해 정규식 수정
          const cityNameForSearch = currentCity.replace(/[시군구]$/, '');
          const foundArea = foundGroup.areas.find(area => area.area_name.includes(cityNameForSearch));
          
          // [5] 일치하는 지역이 있으면 해당 지역 ID와 도시 목록을 반환합니다.
          if (foundArea) {
            const citiesInArea = foundArea.area_name.split('∙').map(name => `${name}시`);
            return {
              regionId: foundGroup.id, // PLAB 지역 그룹 ID
              cities: citiesInArea, // 해당 지역 그룹에 속한 도시 목록
              currentCity: currentCity, // 현재 사용자의 도시
              region: region, // 현재 사용자의 지역(시/도)
              areaNo: areaNo, // 가장 가까운 행정구역코드
              grid: grid // 격자 좌표
            };
          }
        }
      }
    }
    // [6] try 블록 내에서 모든 조건이 맞지 않아 return에 실패한 경우, 의도적으로 에러를 발생시켜 catch로 넘김
    throw new Error('주소 정보를 기반으로 지역 ID를 찾는 데 실패했습니다.');

  } catch (error) {
    // 4) 에러 발생 시 기본 지역(경기도) ID와 안양시 좌표를 반환합니다.
    console.error("위치 정보 가져오기 실패:", error.message);
    console.log("기본 지역(경기도) ID와 안양시 좌표를 사용합니다.");
    return { 
        regionId: 2, 
        cities: ['안양시', '과천시', '군포시', '의왕시'], 
        currentCity: '안양시',
        region: '경기도',
        areaNo: '4117300000', // 안양시 동안구 대표 코드
        grid: { nx: 60, ny: 121 } // 안양시 격자 좌표
    };
  }
};