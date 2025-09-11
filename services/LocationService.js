// services/LocationService.js

import {
  PLAB_REGIONS,
  KMA_AREA_CODES,
  GYEONGGI_BUKBU_CITIES,
  ASOS_STATIONS,
  AIR_KOREA_STATIONS,
} from '../constants';
import * as LocationProvider from '../providers/locationProvider';
import * as LocationUtils from '../utils/locationTransformer';

// (⭐ '매직 스트링'을 상수로 관리)
export const LOCATION_TYPE = {
  GPS: '내 위치',
  DEFAULT: '현재 위치', // 안양시
};

// 안양시 기본 정보
const ANYANG_DEFAULT_INFO = {
  name: '경기도 안양시',
  regionId: 2,
  cities: ['안양시', '과천시', '군포시', '의왕시'],
  currentCity: '안양시',
  region: '경기도',
  airQualityRegion: '경기남부',
  areaNo: '4117300000',
  grid: { nx: 60, ny: 121 },
  coords: { latitude: 37.3943, longitude: 126.9568 },
  stationId: '119',
  stationList: [
    { stationName: '부림동', lat: 37.394295443, lon: 126.956832814 },
  ],
  timezone: 'Asia/Seoul',
};

/**
 * GPS 기반으로 사용자 위치 정보를 구성합니다.
 * @returns {Promise<Object>} 최종 위치 정보 객체
 */
async function getGpsBasedInfo() {
  const { coords, address } = await LocationProvider.fetchUserGpsLocation();

  const plabInfo = LocationUtils.findPlabRegionInfo(
    address,
    PLAB_REGIONS,
    GYEONGGI_BUKBU_CITIES,
  );
  if (!plabInfo) {
    throw new Error('Could not find a matching PLAB region for the address.');
  }

  const grid = LocationUtils.convertGpsToGrid(
    coords.latitude,
    coords.longitude,
  );

  const closestKmaArea = LocationUtils.findClosest(
    coords,
    KMA_AREA_CODES,
    item => ({ lat: item.lat, lon: item.lon }),
  );

  const closestAsosStation = LocationUtils.findClosest(
    coords,
    ASOS_STATIONS,
    item => ({ lat: item.lat, lon: item.lon }),
  );

  const sortedAirKoreaStations = LocationUtils.sortByDistance(
    coords,
    AIR_KOREA_STATIONS,
    item => ({ lat: item.lat, lon: item.lon }),
  );

  return {
    ...plabInfo,
    coords,
    grid,
    areaNo: closestKmaArea
      ? String(closestKmaArea['행정구역코드'])
      : '4117300000',
    stationId: closestAsosStation ? closestAsosStation.id : '119',
    stationList: sortedAirKoreaStations,
    timezone: address.timezone || 'Asia/Seoul',
  };
}

/**
 * 검색된 지역 이름 기반으로 위치 정보를 구성합니다.
 * @param {string} locationName - 지역 이름
 * @returns {Object | null} 최종 위치 정보 객체
 */
function getSearchedLocationInfo(locationName) {
  const foundLocation = LocationProvider.findLocationDataByName(locationName);
  if (!foundLocation) return null;

  const mockAddress = {
    region: foundLocation['1단계'],
    city: foundLocation['2단계'],
    district: foundLocation['2단계'],
  };

  const plabInfo = LocationUtils.findPlabRegionInfo(
    mockAddress,
    PLAB_REGIONS,
    GYEONGGI_BUKBU_CITIES,
  );
  if (!plabInfo) return null;

  const coords = { latitude: foundLocation.lat, longitude: foundLocation.lon };

  // (⭐ 추가) 검색된 위치에 대해서도 관측소 정보를 찾아줍니다.
  const closestAsosStation = LocationUtils.findClosest(
    coords,
    ASOS_STATIONS,
    item => ({ lat: item.lat, lon: item.lon }),
  );
  const sortedAirKoreaStations = LocationUtils.sortByDistance(
    coords,
    AIR_KOREA_STATIONS,
    item => ({ lat: item.lat, lon: item.lon }),
  );

  return {
    ...plabInfo,
    areaNo: String(foundLocation['행정구역코드']),
    grid: { nx: foundLocation.gridX, ny: foundLocation.gridY },
    coords,
    stationId: closestAsosStation ? closestAsosStation.id : '119',
    stationList: sortedAirKoreaStations,
    timezone: 'Asia/Seoul',
  };
}

/**
 * (⭐ 최종 Export 함수)
 * 요청된 위치 이름에 따라 적절한 지역 정보를 반환합니다.
 * @param {string} locationName - 지역 이름 (예: "내 위치", "현재 위치", "서울특별시 종로구")
 * @returns {Promise<Object>} 최종 위치 정보 객체
 */
export const getLocationInfo = async (locationName = LOCATION_TYPE.GPS) => {
  try {
    switch (locationName) {
      case LOCATION_TYPE.GPS:
        console.log('🛰️ GPS 기반으로 실제 사용자 위치를 탐색합니다.');
        return await getGpsBasedInfo();

      case LOCATION_TYPE.DEFAULT:
        console.log("✅ '현재 위치'(안양시)에 대한 고정 정보를 반환합니다.");
        return ANYANG_DEFAULT_INFO;

      default:
        console.log(`🔍 '${locationName}' 지역 정보를 검색합니다.`);
        const searchedInfo = getSearchedLocationInfo(locationName);
        if (searchedInfo) return searchedInfo;
        // 검색 실패 시 기본값(안양시) 반환
        throw new Error(`'${locationName}' 정보를 찾지 못했습니다.`);
    }
  } catch (error) {
    console.warn(
      `[LocationService Error] ${error.message}. 기본 위치(안양시) 정보를 반환합니다.`,
    );
    return ANYANG_DEFAULT_INFO;
  }
};
