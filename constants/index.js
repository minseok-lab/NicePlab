// constants/index.js
export * from './colors';
export * from './links';
export * from './plabLevelTiers';
export * from './plabRegion';
// .json 파일은 default export로 가져와서 named export로 다시 내보냅니다.
import KMA_AREA_CODES from './kmaAreaCodes.json';
export { KMA_AREA_CODES };