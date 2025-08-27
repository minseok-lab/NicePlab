// utils/locationUtils.js

// --- 1. 위치 정보 관련 유틸리티 함수들 ---
import * as Location from 'expo-location'; // Expo 위치 정보 API
import { PLAB_REGIONS, KMA_AREA_CODES } from '../constants'; // PLAB 지역 그룹 데이터와 기상청 자외선 API 지역 코드를 불러옵니다.
import { GYEONGGI_BUKBU_CITIES } from '../constants/gyeonggiRegions';

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

    // 4) 위도(lat)와 경도(lon)를 격자 좌표(nx, ny)로 변환합니다.
    let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    
    // 5) 최종 격자 좌표 계산
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
    // 2) 유효한 gridX, Y 값이 있는 지역만 대상으로 합니다.
    if (area['gridX'] && area['gridY']) {
      const dx = area['gridX'] - grid.nx;
      const dy = area['gridY'] - grid.ny;
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

// --- 4. 사용자 위치 및 주소 정보 가져오기 ---
/**
 * 사용자의 위치 권한을 요청하고 현재 위치 좌표와 주소 정보를 반환합니다.
 * @returns {Promise<{coords: Location.LocationObjectCoords, address: Location.LocationGeocodedAddress}>}
 * @throws {Error} 권한 거부 또는 주소 변환 실패 시 에러를 발생시킵니다.
 */
async function getUserLocationAndAddress() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permission to access location was denied.');
    }

    const location = await Location.getCurrentPositionAsync({});
    const addresses = await Location.reverseGeocodeAsync(location.coords);

    if (!addresses || addresses.length === 0) {
        throw new Error('Failed to reverse geocode location.');
    }

    return { coords: location.coords, address: addresses[0] };
}

// --- 5. 기상청 격자 정보 계산하기 ---
/**
 * 위도, 경도 좌표를 기상청 격자 좌표와 지역 코드로 변환합니다.
 * @param {object} coords - { latitude: number, longitude: number }
 * @returns {{grid: {nx: number, ny: number}, areaNo: string}}
 */
function getKmaAreaInfo(coords) {
    const grid = convertGpsToGrid(coords.latitude, coords.longitude);
    const areaNo = findClosestAreaCode(grid);
    return { grid, areaNo };
}

// --- 6. 주소 정보를 바탕으로 PLAB 지역 정보 찾기 ---
/**
 * 주소 정보를 바탕으로 PLAB 지역 그룹 정보와 대기질 측정 지역 정보를 찾습니다.
 * @param {object} address - Expo Location의 reverseGeocodeAsync 결과 객체
 * @returns {object|null} - 매칭되는 지역 정보 또는 찾지 못한 경우 null
 */
function findPlabRegionInfo(address) {
    const { region, city, district } = address;
    
    // 서울특별시 등 'city'가 null인 경우 'district'를 사용
    const currentCity = city || district;

    if (!region || !currentCity) {
        return null;
    }

    // '경기도'를 '경기북부'/'경기남부'로 구분 -- 자외선 지표 처리를 위함
    let airQualityRegion = region;
    if (region === '경기도') {
        airQualityRegion = GYEONGGI_BUKBU_CITIES.includes(currentCity) ? '경기북부' : '경기남부';
    }

    const foundGroup = PLAB_REGIONS.find(group =>
        region.includes(group.area_group_name.substring(0, 2))
    );

    if (!foundGroup) {
        return null;
    }

    const cityNameForSearch = currentCity.replace(/[시군구]$/, '');
    const foundArea = foundGroup.areas.find(area =>
        area.area_name.includes(cityNameForSearch)
    );

    if (!foundArea) {
        return null;
    }
    
    const citiesInArea = foundArea.area_name.map(name => `${name}시`);

    return {
        regionId: foundGroup.id,
        cities: citiesInArea,
        currentCity: currentCity,
        region: region,
        airQualityRegion: airQualityRegion,
    };
}


// --- 7. 모든 정보를 조합하여 최종 결과 반환 ---
/**
 * 사용자의 현재 위치를 기반으로 날씨 API에 필요한 모든 지역 정보를 반환합니다.
 * 위치 정보 획득에 실패하거나 매칭되는 지역을 찾지 못하면 null을 반환합니다.
 * @returns {Promise<object|null>} 지역 정보 객체 또는 null
 */
export const getRegionIdFromLocation = async () => {
    try {
        // 1) 사용자 위치와 주소 가져오기
        const { coords, address } = await getUserLocationAndAddress();

        // 2) PLAB 지역 정보 찾기
        const plabInfo = findPlabRegionInfo(address);
        if (!plabInfo) {
            // 주소는 찾았지만, 우리 시스템(PLAB_REGIONS)에서 매칭되는 지역이 없는 경우
            throw new Error('Could not find a matching PLAB region for the address.');
        }

        // 3) 기상청 격자 정보 찾기
        const kmaInfo = getKmaAreaInfo(coords);

        // 4) 모든 정보를 조합하여 최종 결과 반환
        return {
            ...plabInfo,
            ...kmaInfo,
        };

    } catch (error) {
        // 위치 권한 거부, 주소 변환 실패, 지역 매칭 실패 등 모든 에러를 여기서 처리
        console.error("Failed to get region information:", error.message);
        return null; // 에러 발생 시 null을 반환하여 호출 측에서 처리하도록 함
    }
};

// --- 8. 에러 발생 시 사용할 기본값 (필요 시 호출 측에서 사용) ---
export const getDefaultRegionInfo = () => ({
    regionId: 2,
    cities: ['안양시', '과천시', '군포시', '의왕시'],
    currentCity: '안양시',
    region: '경기도',
    airQualityRegion: '경기남부', // 기본값은 경기남부로 설정
    areaNo: '4117300000',
    grid: { nx: 60, ny: 121 },
});
