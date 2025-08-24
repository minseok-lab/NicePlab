// constants/links.js

// Plab 관련 링크
export const PLAB_FOOTBALL_URL = 'https://www.plabfootball.com/';

export function getLevelBadgeUrl(tierEnName) {
  return `https://d31wz4d3hgve8q.cloudfront.net/media/img/level_${tierEnName}_badge.svg`;
}

// API 엔드포인트를 관리하는 객체
export const API_ENDPOINTS = {
  KMA_WEATHER: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
  KMA_UV: 'http://apis.data.go.kr/1360000/LivingWthrIdxServiceV4/getUVIdxV4',
  AIR_QUALITY: 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMinuDustFrcstDspth',
  PLAB_MATCHES: 'https://api.plabfootball.com/api/v2/matches',
  // 1. 동적 URL을 생성하는 함수 형식으로 수정
  PLAB_MATCH_DETAILS: (id) => `${process.env.EXPO_PUBLIC_PLAB_DETAIL_API_URL}/${id}`,
};

// API 키 (보안을 위해 별도 파일이나 환경 변수로 관리하는 것을 추천)
export const AIR_QUALITY_API_KEY = process.env.EXPO_PUBLIC_KMA_AIR_API_KEY; 
export const KMA_WEATHER_API_KEY = process.env.EXPO_PUBLIC_KMA_WEATHER_API_KEY;
export const PLAB_DETAIL_API_URL = process.env.EXPO_PUBLIC_PLAB_DETAIL_API_URL;
export const KMA_UV_API_KEY = process.env.EXPO_PUBLIC_KMA_LIFE_API_KEY;
