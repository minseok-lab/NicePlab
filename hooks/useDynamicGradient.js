// hooks/useDynamicGradient.js

import { useState, useEffect } from 'react';

import SunCalc from 'suncalc'; // <<< 변경: SunCalc를 import 합니다.
import { PALETTE } from '../styles/colors';
import { getUserLocationAndAddress } from '../utils/locationUtils'; 

// GRADIENT_SETTINGS는 변경사항 없습니다.
const GRADIENT_SETTINGS = {
  sunrise: {
    colors: [PALETTE.gradient.sunrise.start, PALETTE.gradient.sunrise.end],
    statusBar: 'dark-content',
  },
  day: {
    colors: [PALETTE.gradient.day.start, PALETTE.gradient.day.end],
    statusBar: 'dark-content',
  },
  sunset: {
    colors: [PALETTE.gradient.sunset.start, PALETTE.gradient.sunset.end],
    statusBar: 'light-content',
  },
  night: {
    colors: [PALETTE.gradient.night.start, PALETTE.gradient.night.end],
    statusBar: 'light-content',
  },
};

// <<< 변경: 시간 판단 로직은 그대로 사용합니다.
// SunCalc가 반환하는 객체에는 civil twilight 시작(dawn)과 종료(dusk) 시간이 포함되어 있습니다.
function getCurrentTimePeriod({ sunrise, sunset, dawn, dusk }) {
  const now = new Date();

  if (now >= dawn && now < sunrise) return 'sunrise';
  if (now >= sunset && now < dusk) return 'sunset';
  if (now >= sunrise && now < sunset) return 'day';
  return 'night';
}

export function useDynamicGradient() {
  const [gradientSettings, setGradientSettings] = useState(GRADIENT_SETTINGS.day);

  useEffect(() => {
    // <<< 변경: 전체 로직을 locationUtils를 사용하도록 수정합니다.
    const setGradient = async () => {
      try {
        // 1. locationUtils를 통해 위치 정보와 주소를 가져옵니다.
        const locationData = await getUserLocationAndAddress();

        // 위치 정보를 성공적으로 가져왔을 경우에만 실행합니다.
        if (locationData && locationData.coords) {
          const { latitude, longitude } = locationData.coords;

          // 2. SunCalc를 이용해 시간 정보를 계산합니다.
          const sunTimes = SunCalc.getTimes(new Date(), latitude, longitude);
          
          // 3. 시간대에 맞는 스타일을 적용합니다.
          const period = getCurrentTimePeriod(sunTimes);
          setGradientSettings(GRADIENT_SETTINGS[period]);
        }
      } catch (error) {
        // 위치 정보 가져오기 실패 시 콘솔에 에러를 출력하고 기본값(밤)을 유지합니다.
        console.error("Failed to set dynamic gradient:", error.message);
      }
    };

    setGradient();
  }, []); // 앱이 처음 시작될 때 한 번만 실행

  return gradientSettings;
}