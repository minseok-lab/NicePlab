// utils/formatter/weatherFormatter.js

// 1. 단 한 줄로 모든 아이콘을 import 합니다.
// - 가독성: 파일의 의존성이 아이콘 모듈 하나라는 것을 명확히 보여줍니다.
// - 유지보수성: 아이콘이 추가/삭제 되어도 이 파일은 수정할 필요가 없습니다.
import * as icons from '../../assets/weatherIcon'; // index.js 파일은 생략 가능

// 2. 날씨 데이터 객체는 import한 icons 객체를 사용하도록 수정합니다.
const WEATHER_CONDITIONS = {
  pty: {
    1: { icon: icons.rainIcon, text: '비' },
    2: { icon: icons.snowRainIcon, text: '비/눈' },
    3: { icon: icons.snowIcon, text: '눈' },
    4: { icon: icons.rainIcon, text: '소나기' },
    5: { icon: icons.rainIcon, text: '빗방울' },
    6: { icon: icons.snowRainIcon, text: '빗방울/눈날림' },
    7: { icon: icons.snowIcon, text: '눈날림' },
  },
  sky: {
    1: { icon: icons.sunnyIcon, text: '맑음' },
    3: { icon: icons.partlyCloudyIcon, text: '구름많음' },
    4: { icon: icons.cloudyIcon, text: '흐림' },
  },
};

const UNKNOWN_WEATHER = { icon: icons.nullIcon, text: '알 수 없음' };

/**
 * 기능: 기상청의 하늘상태(sky), 강수형태(pty) 코드를 받아 아이콘과 텍스트로 변환합니다.
 * (JSDoc 주석은 이전과 동일)
 */
export const formatWeather = (sky, pty) => {
  if (pty > 0) {
    return WEATHER_CONDITIONS.pty[pty] || UNKNOWN_WEATHER;
  }
  return WEATHER_CONDITIONS.sky[sky] || UNKNOWN_WEATHER;
};