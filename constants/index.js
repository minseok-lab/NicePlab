// constants/index.js
export * from './links';
export * from './plabLevelTiers';
export * from './plabRegion';
export * from './gyeonggiRegions';
export * from './airKoreaRegion';
export * from './airKoreaStations';
export * from './kmaAsosStations';

// .json 파일은 default export로 가져와서 named export로 다시 내보냅니다.
import KMA_AREA_CODES from './kmaAreaCodes.json';
export { KMA_AREA_CODES };
