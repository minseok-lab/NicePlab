// utils/locationTransformer.js

/**
 * 위경도 좌표를 기상청 격자 좌표로 변환합니다.
 * @param {number} lat 위도
 * @param {number} lon 경도
 * @returns {{nx: number, ny: number}} 격자 좌표
 */
export function convertGpsToGrid(lat, lon) {
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

/**
 * (⭐ 새로 추가된 범용 함수)
 * 좌표 목록에서 기준 좌표와 가장 가까운 항목을 찾습니다.
 * @param {{latitude: number, longitude: number}} targetCoords 기준 좌표
 * @param {Array<Object>} dataPoints 전체 좌표 데이터 배열
 * @param {function(Object): {lat: number, lon: number}} coordsAccessor 데이터에서 좌표를 추출하는 함수
 * @returns {Object | null} 가장 가까운 데이터 항목
 */
export function findClosest(targetCoords, dataPoints, coordsAccessor) {
  let closestItem = null;
  let minDistance = Infinity;

  for (const item of dataPoints) {
    const itemCoords = coordsAccessor(item);
    if (
      !itemCoords ||
      itemCoords.lat === undefined ||
      itemCoords.lon === undefined
    )
      continue;

    const dx = targetCoords.latitude - itemCoords.lat;
    const dy = targetCoords.longitude - itemCoords.lon;
    const distance = dx * dx + dy * dy; // 제곱근 계산은 불필요하므로 성능상 이점

    if (distance < minDistance) {
      minDistance = distance;
      closestItem = item;
    }
  }
  return closestItem;
}

/**
 * (⭐ 새로 추가된 범용 함수)
 * 좌표 목록을 기준 좌표로부터 가까운 순으로 정렬하여 반환합니다.
 * @param {{latitude: number, longitude: number}} targetCoords 기준 좌표
 * @param {Array<Object>} dataPoints 전체 좌표 데이터 배열
 * @param {function(Object): {lat: number, lon: number}} coordsAccessor 데이터에서 좌표를 추출하는 함수
 * @returns {Array<Object>} 거리에 따라 정렬된 데이터 배열
 */
export function sortByDistance(targetCoords, dataPoints, coordsAccessor) {
  const itemsWithDistance = dataPoints.map(item => {
    const itemCoords = coordsAccessor(item);
    const dx = targetCoords.latitude - itemCoords.lat;
    const dy = targetCoords.longitude - itemCoords.lon;
    const distance = dx * dx + dy * dy;
    return { ...item, distance };
  });

  itemsWithDistance.sort((a, b) => a.distance - b.distance);
  return itemsWithDistance;
}

/**
 * 주소 객체를 기반으로 PLAB 지역 정보를 찾습니다.
 * @param {Object} address - { region, city, district } 주소 객체
 * @param {Array} PLAB_REGIONS - PLAB 지역 상수 데이터
 * @param {Array} GYEONGGI_BUKBU_CITIES - 경기 북부 도시 상수 데이터
 * @returns {Object | null} 찾은 PLAB 지역 정보
 */
export function findPlabRegionInfo(
  address,
  PLAB_REGIONS,
  GYEONGGI_BUKBU_CITIES,
) {
  // 상수를 직접 import하지 않고 파라미터로 받아 순수 함수로 만듭니다.
  const { region, city, district } = address;
  const currentCity = city || district;

  if (!region || !currentCity) return null;

  let airQualityRegion = region;
  if (region === '경기도') {
    airQualityRegion = GYEONGGI_BUKBU_CITIES.includes(currentCity)
      ? '경기북부'
      : '경기남부';
  }

  const foundGroup = PLAB_REGIONS.find(group =>
    region.includes(group.area_group_name.substring(0, 2)),
  );
  if (!foundGroup) return null;

  let userCityNormalized = currentCity.includes('시')
    ? currentCity.split('시')[0]
    : currentCity.replace(/구$/, '');

  const foundArea = foundGroup.areas.find(area =>
    area.area_name.some(dataName => {
      const dataNameNormalized = dataName.replace(/[시군구]$/, '');
      return dataNameNormalized === userCityNormalized;
    }),
  );

  if (!foundArea) return null;

  return {
    regionId: foundGroup.id,
    cities: foundArea.area_name,
    currentCity: currentCity,
    region: region,
    airQualityRegion: airQualityRegion,
  };
}
