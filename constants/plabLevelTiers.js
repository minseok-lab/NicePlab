// constants/plabLevelTiers.js

/**
 * 플랩풋볼의 공식 레벨 티어 및 해당 숫자 범위를 정의합니다.
 * 이 데이터는 레벨을 티어 이름으로 변환하는 데 사용됩니다.
 */
export const PLAB_LEVEL_TIERS = [
  // name: 한글 티어명, en_name: 영문 티어명
  { name: '루키', en_name: 'rookie', min_level: 0.0, max_level: 0.0 },
  { name: '비기너1', en_name: 'beginner1', min_level: 0.1, max_level: 1.0 },
  { name: '비기너2', en_name: 'beginner2', min_level: 1.1, max_level: 1.4 },
  { name: '비기너3', en_name: 'beginner3', min_level: 1.5, max_level: 2.0 },
  { name: '아마추어1', en_name: 'amateur1', min_level: 2.1, max_level: 2.2 },
  { name: '아마추어2', en_name: 'amateur2', min_level: 2.3, max_level: 2.4 },
  { name: '아마추어3', en_name: 'amateur3', min_level: 2.5, max_level: 2.6 },
  { name: '아마추어4', en_name: 'amateur4', min_level: 2.7, max_level: 2.8 },
  { name: '아마추어5', en_name: 'amateur5', min_level: 2.9, max_level: 3.0 },
  { name: '세미프로1', en_name: 'semipro1', min_level: 3.1, max_level: 3.3 },
  { name: '세미프로2', en_name: 'semipro2', min_level: 3.4, max_level: 3.6 },
  { name: '세미프로3', en_name: 'semipro3', min_level: 3.7, max_level: 4.0 },
  { name: '프로', en_name: 'pro', min_level: 4.1, max_level: 5.0 },
];