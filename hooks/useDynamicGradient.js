// hooks/useDynamicGradient.js

import { useState, useEffect } from 'react';
import SunCalc from 'suncalc';
import { PALETTE } from '../styles'; // PALETTE은 그대로 사용합니다.
import { getUserLocationAndAddress } from '../utils';

// SunCalc를 이용한 시간대 계산 함수 (변경 없음)
function getCurrentTimePeriod({ sunrise, sunset, dawn, dusk }) {
  const now = new Date();
  if (now >= dawn && now < sunrise) return 'sunrise';
  if (now >= sunset && now < dusk) return 'sunset';
  if (now >= sunrise && now < sunset) return 'day';
  return 'night';
}

export function useDynamicGradient() {
  const [timePeriod, setTimePeriod] = useState('day');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const setGradient = async () => {
      try {
        const locationData = await getUserLocationAndAddress();
        if (locationData?.coords) {
          const { latitude, longitude } = locationData.coords;
          setLocation({ latitude, longitude });
          const updatePeriod = () => {
            const sunTimes = SunCalc.getTimes(new Date(), latitude, longitude);
            const period = getCurrentTimePeriod(sunTimes);
            setTimePeriod(period);
          };

          updatePeriod();
          const intervalId = setInterval(updatePeriod, 600000); // 10분마다
          return () => clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Failed to set dynamic gradient:', error.message);
        setTimePeriod('day'); // 에러 발생 시 '낮' 테마로 fallback
      }
    };

    setGradient();
  }, []);

  // ▼▼▼ 핵심 변경사항 ▼▼▼
  // 더 이상 GRADIENT_SETTINGS를 사용하지 않고, PALETTE에서 직접 테마 정보를 가져옵니다.
  const currentTheme = PALETTE.themes[timePeriod];

  return {
    // 새로운 PALETTE 구조에 맞게 반환값 수정
    colors: [currentTheme.gradient.start, currentTheme.gradient.end],
    statusBar: currentTheme.statusBar,
    state: timePeriod,
    location,
  };
  // ▲▲▲ 핵심 변경사항 ▲▲▲
}
