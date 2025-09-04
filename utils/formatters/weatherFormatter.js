// utils/formatter/weatherFormatter.js

// 1. 단 한 줄로 모든 아이콘을 import 합니다.
// - 가독성: 파일의 의존성이 아이콘 모듈 하나라는 것을 명확히 보여줍니다.
// - 유지보수성: 아이콘이 추가/삭제 되어도 이 파일은 수정할 필요가 없습니다.
import * as icons from '../../assets/weatherIcon'; // index.js 파일은 생략 가능

// 2. 날씨 데이터 객체는 import한 icons 객체를 사용하도록 수정합니다.
const WEATHER_CONDITIONS = {
  pty: {
    1: { dayIcon: icons.rainIcon, nightIcon: icons.darkRainIcon, text: '비' },
    2: { dayIcon: icons.snowRainIcon, nightIcon: icons.darkSnowRainIcon, text: '비/눈' },
    3: { dayIcon: icons.snowIcon, nightIcon: icons.darkSnowIcon, text: '눈' },
    4: { dayIcon: icons.rainIcon, nightIcon: icons.darkRainIcon, text: '소나기' },
    5: { dayIcon: icons.rainIcon, nightIcon: icons.darkRainIcon, text: '빗방울' },
    6: { dayIcon: icons.snowRainIcon, nightIcon: icons.darkSnowRainIcon, text: '빗방울/눈날림' },
    7: { dayIcon: icons.snowIcon, nightIcon: icons.darkSnowIcon, text: '눈날림' },
  },
  sky: {
    1: { dayIcon: icons.clearIcon, nightIcon: icons.darkClearIcon, text: '맑음' },
    3: { dayIcon: icons.partlyCloudyIcon, nightIcon: icons.darkPartlyCloudyIcon, text: '구름많음' },
    4: { dayIcon: icons.cloudyIcon, nightIcon: icons.darkCloudyIcon, text: '흐림' },
  },
};

const UNKNOWN_WEATHER = { dayIcon: icons.nullIcon, nightIcon: icons.darkNullIcon, text: '알 수 없음' };

/**
 * 기능: 하늘상태(sky), 강수형태(pty) 코드와 낮/밤 여부를 받아 아이콘과 텍스트로 변환합니다.
 * @param {string | number} sky - 하늘 상태 코드 (맑음: 1, 구름많음: 3, 흐림: 4)
 * @param {string | number} pty - 강수 형태 코드 (없음: 0, 비: 1, 비/눈: 2, 눈: 3, 소나기: 4 등)
 * @param {boolean} isDay - 낮이면 true, 밤이면 false
 * @returns {{icon: any, text: string}} 날씨 정보 객체 (아이콘, 텍스트)
 */
export const formatWeather = (sky, pty, isDay) => {
  // pty 코드가 0보다 크면 강수 상태를, 아니면 하늘 상태를 확인합니다.
  const condition = pty > 0
    ? WEATHER_CONDITIONS.pty[pty]
    : WEATHER_CONDITIONS.sky[sky];

  // 날씨 정보가 없으면 UNKNOWN_WEATHER를 사용합니다.
  const weatherInfo = condition || UNKNOWN_WEATHER;

  // isDay 값에 따라 적절한 아이콘을 선택합니다.
  const icon = isDay ? weatherInfo.dayIcon : weatherInfo.nightIcon;

  return { icon, text: weatherInfo.text };
};