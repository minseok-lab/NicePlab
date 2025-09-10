// locationResolver.js

// --- 1. 모듈 및 상수 임포트 ---
import * as Location from 'expo-location';
import { findLocationByName } from './searchLocationUtils';
import { PLAB_REGIONS, KMA_AREA_CODES } from '../constants';
import { GYEONGGI_BUKBU_CITIES } from '../constants/gyeonggiRegions';
import { ASOS_STATIONS } from '../constants/kmaAsosStations';
import { AIR_KOREA_STATIONS } from '../constants/airKoreaStations';

// --- 2. 좌표 변환 및 지역 코드 검색 함수들 (기존 코드와 동일) ---

function convertGpsToGrid(lat, lon) {
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

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

function findClosestAreaCode(grid) {
  let closestArea = null;
  let minDistance = Infinity;

  for (const area of KMA_AREA_CODES) {
    if (area.gridX && area.gridY) {
      const dx = area.gridX - grid.nx;
      const dy = area.gridY - grid.ny;
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

export async function getUserLocationAndAddress() {
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
  const grid = convertGpsToGrid(coords.latitude, coords.longitude);
  const areaNo = findClosestAreaCode(grid);
  return { grid, areaNo };
}

function findPlabRegionInfo(address) {
  const { region, city, district } = address;

  // city를 district보다 우선적으로 사용하도록 순서를 설정합니다.
  const currentCity = city || district;

  console.log(
    `📍[Debug] Matching with: region='${region}', city='${city}', district='${district}' -> currentCity='${currentCity}'`,
  );

  if (!region || !currentCity) {
    return null;
  }

  let airQualityRegion = region;
  if (region === '경기도') {
    airQualityRegion = GYEONGGI_BUKBU_CITIES.includes(currentCity)
      ? '경기북부'
      : '경기남부';
  }

  const foundGroup = PLAB_REGIONS.find(group =>
    region.includes(group.area_group_name.substring(0, 2)),
  );

  if (!foundGroup) {
    console.log(
      `📍[Debug] Match failed. Could not find a matching group for region '${region}'.`,
    );
    return null;
  }

  let userCityNormalized;
  if (currentCity.includes('시')) {
    // '시'가 포함된 경우 (e.g., '천안시동남구', '수원시팔달구')
    // '시'를 기준으로 문자열을 잘라 앞부분을 사용합니다. -> '천안', '수원'
    userCityNormalized = currentCity.split('시')[0];
  } else {
    // '시'가 없는 경우 (e.g., '종로구', '강남구')
    // 기존처럼 마지막 '구'만 제거합니다. -> '종로', '강남'
    userCityNormalized = currentCity.replace(/구$/, '');
  }

  console.log(
    `📍[Debug] Normalized city for matching: '${userCityNormalized}'`,
  );

  const foundArea = foundGroup.areas.find(area =>
    area.area_name.some(dataName => {
      const dataNameNormalized = dataName.replace(/[시군구]$/, '');
      return dataNameNormalized === userCityNormalized;
    }),
  );

  if (!foundArea) {
    console.log(
      `📍[Debug] Match failed. Could not find a matching area for '${userCityNormalized}' in the PLAB_REGIONS constant.`,
    );
    return null;
  }

  const citiesInArea = foundArea.area_name;

  return {
    regionId: foundGroup.id,
    cities: citiesInArea,
    currentCity: currentCity,
    region: region,
    airQualityRegion: airQualityRegion,
  };
}

// 1) 위경도 기반으로 가장 가까운 ASOS 관측소 ID를 찾는 함수
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

/**
 * 위경도 기반으로 가까운 순서대로 '대기질 측정소 목록'을 반환하는 함수
 * @param {object} coords - { latitude, longitude }
 * @returns {Array} - 가까운 순으로 정렬된 측정소 객체 배열
 */
function getStationsSortedByDistance({ latitude, longitude }) {
  // 1. 모든 측정소와의 거리를 계산합니다.
  const stationsWithDistance = AIR_KOREA_STATIONS.map(station => {
    const dx = latitude - station.lat;
    const dy = longitude - station.lon;
    const distance = dx * dx + dy * dy;
    return { ...station, distance }; // 기존 station 정보에 거리 추가
  });

  // 2. 거리를 기준으로 오름차순 정렬합니다.
  stationsWithDistance.sort((a, b) => a.distance - b.distance);

  // 3. 정렬된 목록 전체를 반환합니다.
  return stationsWithDistance;
}

// 2) GPS 기반 정보 조회 함수 수정 (stationName 추가)
async function getGpsBasedRegionInfo() {
  try {
    const { coords, address } = await getUserLocationAndAddress();
    console.log(
      '📍[Debug] Reverse Geocoded Address:',
      JSON.stringify(address, null, 2),
    );
    const plabInfo = findPlabRegionInfo(address);
    if (!plabInfo) {
      throw new Error('Could not find a matching PLAB region for the address.');
    }
    const kmaInfo = getKmaAreaInfo(coords);
    const stationId = findClosestKMAStationId(coords);

    // 새로 만든 함수를 호출합니다.
    const stationList = getStationsSortedByDistance(coords);
    const timezone = address.timezone || 'Asia/Seoul';

    // 최종 반환 객체에 stationName을 포함시킵니다.
    return {
      coords,
      ...plabInfo,
      ...kmaInfo,
      stationId,
      stationList,
      timezone,
    };
  } catch (error) {
    console.error('Failed to get GPS-based region information:', error.message);
    return null;
  }
}

// 3) '현재 위치'(안양시) 정보 함수
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
    stationList: [
      { stationName: '부림동', lat: 37.394295443, lon: 126.956832814 },
    ],
    timezone: 'Asia/Seoul',
  };
}

// --- 6. 메인 로직: 위치 이름에 따라 정보 소스를 선택 (⭐ 수정된 메인 함수) ---
/**
 * 요청된 위치 이름에 따라 적절한 지역 정보를 반환합니다.
 * @param {string} locationName - 지역 이름 (예: "내 위치", "현재 위치")
 * @returns {Promise<object|null>} 지역 정보 객체 또는 null
 */
export const getWeatherLocationInfo = async (locationName = '내 위치') => {
  if (locationName === '현재 위치') {
    console.log("✅ '현재 위치'(안양시)에 대한 고정 정보를 반환합니다.");
    return getCurrentLocationInfo();
  }

  // '내 위치'일 경우에만 GPS 기반으로 위치를 탐색하도록 수정
  if (locationName === '내 위치') {
    console.log('------------------------------------------------------');
    console.log('|--- 🛰️ GPS 기반으로 실제 사용자 위치를 탐색합니다. ---| ');
    console.log('------------------------------------------------------');
    const regionInfo = await getGpsBasedRegionInfo();

    // GPS 정보 획득 실패 시, '현재 위치'(안양시) 정보로 대체합니다.
    if (!regionInfo) {
      console.warn(
        "GPS 위치 정보 획득에 실패하여 '현재 위치'(안양시) 정보로 대체합니다.",
      );
      return getCurrentLocationInfo();
    }

    return regionInfo;
  }

  // ✨ 3. 그 외의 경우 (검색된 지역 이름이 들어온 경우)
  console.log(`🔍 '${locationName}' 지역 정보를 검색합니다.`);
  const foundLocation = findLocationByName(locationName);

  if (foundLocation) {
    // 찾은 지역 정보를 바탕으로 findPlabRegionInfo가 이해할 수 있는 가상의 주소 객체를 만듭니다.
    const mockAddress = {
      region: foundLocation['1단계'],
      city: foundLocation['2단계'],
      district: foundLocation['2단계'], // city와 district를 동일하게 설정
    };

    // 2. 기존 로직을 재사용하여 Plab 매치 및 미세먼지에 필요한 정보를 생성합니다.
    const plabInfo = findPlabRegionInfo(mockAddress);

    // 3. kmaAreaCodes에서 찾은 정보와, plabInfo에서 찾은 정보를 합쳐
    //    '완전한' locationInfo 객체를 만듭니다.
    if (plabInfo) {
      return {
        ...plabInfo, // regionId, cities, currentCity, region, airQualityRegion 포함
        areaNo: String(foundLocation['행정구역코드']),
        grid: { nx: foundLocation.gridX, ny: foundLocation.gridY },
        coords: { latitude: foundLocation.lat, longitude: foundLocation.lon },
        timezone: 'Asia/Seoul', // ✨ 검색된 위치에도 타임존 정보 추가
      };
      // stationId, stationList 등 필요한 다른 정보들도 유사한 방식으로 찾아 추가할 수 있습니다.
      // 지금은 핵심 정보만으로 구성합니다.
    }
  }

  // 검색 실패 시 기본값(안양시) 반환
  console.warn(`'${locationName}' 정보를 찾지 못해 기본 위치로 대체합니다.`);
  return getCurrentLocationInfo();
};

// --- 7. 에러 발생 시 사용할 기본값 ---
export const getDefaultRegionInfo = () => getCurrentLocationInfo();
