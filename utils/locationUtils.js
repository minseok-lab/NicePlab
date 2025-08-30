// utils/locationUtils.js

// --- 1. 모듈 및 상수 임포트 ---
import * as Location from 'expo-location';
import { PLAB_REGIONS, KMA_AREA_CODES } from '../constants';
import { GYEONGGI_BUKBU_CITIES } from '../constants/gyeonggiRegions';
import { ASOS_STATIONS } from '../constants/kmaAsosStations';
import { AIR_KOREA_STATIONS } from '../constants/airKoreaStations';

// --- 2. 좌표 변환 및 지역 코드 검색 함수들 (기존 코드와 동일) ---

function convertGpsToGrid(lat, lon) {
    // ... (기존 convertGpsToGrid 함수 내용 그대로)
    const RE = 6371.00877; 
    const GRID = 5.0; 
    const SLAT1 = 30.0; 
    const SLAT2 = 60.0; 
    const OLON = 126.0; 
    const OLAT = 38.0; 
    const XO = 43; 
    const YO = 136; 
    const DEGRAD = Math.PI / 180.0;
 
    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;
 
    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);
 
    let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    
    const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return { nx, ny };
}

function findClosestAreaCode(grid) {
    // ... (기존 findClosestAreaCode 함수 내용 그대로)
    let closestArea = null;
    let minDistance = Infinity;
 
    for (const area of KMA_AREA_CODES) {
      if (area['gridX'] && area['gridY']) {
        const dx = area['gridX'] - grid.nx;
        const dy = area['gridY'] - grid.ny;
        const distance = dx * dx + dy * dy;
 
        if (distance < minDistance) {
          minDistance = distance;
          closestArea = area;
        }
      }
    }
    return closestArea ? String(closestArea['행정구역코드']) : '4117300000';
}

// --- 3. 위치 정보 처리 함수들 (기존 코드와 동일) ---

async function getUserLocationAndAddress() {
    // ... (기존 getUserLocationAndAddress 함수 내용 그대로)
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

function getKmaAreaInfo(coords) {
    // ... (기존 getKmaAreaInfo 함수 내용 그대로)
    const grid = convertGpsToGrid(coords.latitude, coords.longitude);
    const areaNo = findClosestAreaCode(grid);
    return { grid, areaNo };
}

function findPlabRegionInfo(address) {
    const { region, city, district } = address;
    // '구'가 있으면 '구'를 우선 사용, 없으면 '시'를 사용 (예: 서울시 구로구, 수원시 장안구)
    const currentCity = district || city; 

    if (!region || !currentCity) {
        return null;
    }

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

    // ✨ 1. 유연한 비교를 위해 사용자의 현재 위치 이름에서 '시/군/구'를 제거합니다.
    // 예: '구로구' -> '구로', '수원시' -> '수원'
    const userCityNormalized = currentCity.replace(/[시군구]$/, '');

    // ✨ 2. 데이터에 있는 지역 이름도 실시간으로 정규화하여 비교합니다.
    const foundArea = foundGroup.areas.find(area => 
        area.area_name.some(dataName => {
            const dataNameNormalized = dataName.replace(/[시군구]$/, '');
            return dataNameNormalized === userCityNormalized;
        })
    );

    if (!foundArea) {
        return null;
    }
    
    // ✨ 3. 사용자의 위치가 '구'로 끝나는지 확인하여 올바른 단위를 결정합니다.
    const suffix = currentCity.endsWith('구') ? '구' : '시';

    // ✨ 4. 데이터의 모든 지역 이름에서 '시/군/구'를 제거하고 올바른 단위를 붙여줍니다.
    const citiesInArea = foundArea.area_name.map(name => {
        const normalizedName = name.replace(/[시군구]$/, '');
        return `${normalizedName}${suffix}`;
    });

    return {
        regionId: foundGroup.id,
        cities: citiesInArea,
        currentCity: currentCity,
        region: region,
        airQualityRegion: airQualityRegion,
    };
}

// ⭐ 1) 위경도 기반으로 가장 가까운 ASOS 관측소 ID를 찾는 함수
function findClosestKMAStationId({ latitude, longitude }) {
  let closestStation = null;
  let minDistance = Infinity;

  for (const station of ASOS_STATIONS) {
    const dx = latitude - station.lat;
    const dy = longitude - station.lon;
    const distance = dx * dx + dy * dy;

    if (distance < minDistance) {
      minDistance = distance;
      closestStation = station;
    }
  }
  return closestStation ? closestStation.id : '119'; // 못찾으면 수원(안양 근처)을 기본값으로
}

// 👇 [추가] 바로 여기에 새 함수를 추가하세요.
/**
 * ⭐ (신규) 위경도 기반으로 가장 가까운 대기질 측정소 정보를 찾는 함수
 * @param {object} coords - { latitude, longitude }
 * @returns {object} - { stationName: string }
 */
function findClosestAirQualityStation({ latitude, longitude }) {
  let closestStation = null;
  let minDistance = Infinity;

  for (const station of AIR_KOREA_STATIONS) {
    const dx = latitude - station.lat;
    const dy = longitude - station.lon;
    const distance = dx * dx + dy * dy;

    if (distance < minDistance) {
      minDistance = distance;
      closestStation = station;
    }
  }
  
  // 가장 가까운 측정소의 이름을 객체 형태로 반환합니다.
  return {
    stationName: closestStation ? closestStation.stationName : '종로구',
  };
}

// ⭐ 2) GPS 기반 정보 조회 함수 수정 (stationName 추가)
async function getGpsBasedRegionInfo() {
  try {
    const { coords, address } = await getUserLocationAndAddress();
    const plabInfo = findPlabRegionInfo(address);
    if (!plabInfo) {
      throw new Error('Could not find a matching PLAB region for the address.');
    }
    const kmaInfo = getKmaAreaInfo(coords);
    const stationId = findClosestKMAStationId(coords);
    
    // 👇 [추가] 새로 만든 함수를 호출합니다.
    const { stationName } = findClosestAirQualityStation(coords);

    // 👇 [수정] 최종 반환 객체에 stationName을 포함시킵니다.
    return { ...plabInfo, ...kmaInfo, stationId, stationName };
  } catch (error) {
    console.error("Failed to get GPS-based region information:", error.message);
    return null;
  }
}

// ⭐ 3) '현재 위치'(안양시) 정보 함수 수정 (stationId 추가)
function getCurrentLocationInfo() {
  return {
    regionId: 2,
    cities: ['안양시', '과천시', '군포시', '의왕시'],
    currentCity: '안양시',
    region: '경기도',
    airQualityRegion: '경기남부',
    areaNo: '4117300000',
    grid: { nx: 60, ny: 121 },
    stationId: '119', // 안양시에서 가장 가까운 수원 관측소 ID
    stationName: '부림동',
  };
}


// --- 6. 메인 로직: 위치 이름에 따라 정보 소스를 선택 (⭐ 수정된 메인 함수) ---
/**
 * 요청된 위치 이름에 따라 적절한 지역 정보를 반환합니다.
 * @param {string} locationName - 지역 이름 (예: "내 위치", "현재 위치")
 * @returns {Promise<object|null>} 지역 정보 객체 또는 null
 */
export const getWeatherLocationInfo = async (locationName = "내 위치") => {
    if (locationName === "현재 위치") {
        console.log("✅ '현재 위치'(안양시)에 대한 고정 정보를 반환합니다.");
        return getCurrentLocationInfo();
    }
    
    // "내 위치" 또는 그 외의 경우, GPS 기반으로 실제 위치를 탐색합니다.
    console.log("🛰️ GPS 기반으로 실제 사용자 위치를 탐색합니다.");
    const regionInfo = await getGpsBasedRegionInfo();

    // GPS 정보 획득 실패 시, '현재 위치'(안양시) 정보로 대체합니다.
    if (!regionInfo) {
        console.warn("GPS 위치 정보 획득에 실패하여 '현재 위치'(안양시) 정보로 대체합니다.");
        return getCurrentLocationInfo();
    }

    return regionInfo;
};

// --- 7. 에러 발생 시 사용할 기본값 (기존과 동일, 이제 getCurrentLocationInfo로 대체 가능) ---
export const getDefaultRegionInfo = () => getCurrentLocationInfo();