// hooks/useDynamicGradient.js

// 1. Import Sections
// 1) react
import { useState, useEffect, useCallback } from 'react';
import SunCalc from 'suncalc';

// 2) styles, utils
import { PALETTE } from '../styles';
import { getUserLocationAndAddress } from '../utils';

// 2. Helper Functions
/**
 * 1) @description 현재 시간을 기준으로 시간대(sunrise, sunset, day, night)를 반환합니다.
 **** @param {object} sunTimes - SunCalc.getTimes()로 계산된 일출/일몰 시간 객체
 **** @returns {string} 현재 시간대 이름
 */
function getCurrentTimePeriod(sunTimes) {
  const now = new Date();
  const { sunrise, sunset, dawn, dusk } = sunTimes;

  if (now >= dawn && now < sunrise) return 'sunrise';
  if (now >= sunset && now < dusk) return 'sunset';
  if (now >= sunrise && now < sunset) return 'day';
  return 'night';
}

/**
 * 2) @description 다음 시간대 변경까지 남은 시간을 밀리초(ms) 단위로 계산합니다.
 **** @param {object} sunTimes - SunCalc.getTimes()로 계산된 일출/일몰 시간 객체
 **** @returns {number} 다음 이벤트까지 남은 시간 (ms)
 */
function getMillisecondsUntilNextEvent(sunTimes) {
  const now = new Date();
  const events = [
    sunTimes.dawn,
    sunTimes.sunrise,
    sunTimes.sunset,
    sunTimes.dusk,
  ].sort((a, b) => a - b); // 시간 순으로 정렬

  // 현재 시간 이후에 올 가장 가까운 이벤트를 찾습니다.
  const nextEvent = events.find(event => event > now);

  if (nextEvent) {
    return nextEvent - now + 1000; // 정확한 시간에 실행되도록 1초의 여유를 줍니다.
  }

  // 오늘 모든 이벤트가 지났다면, 내일 첫 이벤트까지의 시간을 계산합니다.
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowSunTimes = SunCalc.getTimes(
    tomorrow,
    sunTimes.lat,
    sunTimes.lng,
  );
  const tomorrowFirstEvent = [
    tomorrowSunTimes.dawn,
    tomorrowSunTimes.sunrise,
  ].sort((a, b) => a - b)[0];

  return tomorrowFirstEvent - now + 1000;
}

/**
 * 3) @description 현재 시간대에 따라 동적인 그라데이션과 테마를 제공하는 커스텀 훅
 */
export function useDynamicGradient() {
  const [timePeriod, setTimePeriod] = useState('day'); // 현재 시간대 (day, night 등)
  const [location, setLocation] = useState(null); // 사용자 위치 { latitude, longitude }

  const updateTheme = useCallback((latitude, longitude) => {
    // 주어진 위치와 현재 시간을 기준으로 테마를 업데이트합니다.
    const sunTimes = SunCalc.getTimes(new Date(), latitude, longitude);
    const period = getCurrentTimePeriod(sunTimes);
    setTimePeriod(period);

    // 다음 업데이트를 위한 sunTimes 정보를 반환합니다.
    return { ...sunTimes, lat: latitude, lng: longitude };
  }, []);

  useEffect(() => {
    let timerId = null; // setTimeout의 ID를 저장할 변수

    // 다음 테마 업데이트를 스케줄링하는 재귀 함수
    const scheduleNextUpdate = sunTimes => {
      const delay = getMillisecondsUntilNextEvent(sunTimes);

      // 이전에 설정된 타이머가 있다면 해제합니다.
      if (timerId) clearTimeout(timerId);

      timerId = setTimeout(() => {
        // 시간이 되면 테마를 업데이트하고, 다음 업데이트를 다시 스케줄링합니다.
        const newSunTimes = updateTheme(sunTimes.lat, sunTimes.lng);
        scheduleNextUpdate(newSunTimes);
      }, delay);
    };

    const initialize = async () => {
      try {
        const locationData = await getUserLocationAndAddress();
        if (!locationData?.coords) {
          throw new Error('위치 정보를 가져올 수 없습니다.');
        }

        const { latitude, longitude } = locationData.coords;
        setLocation({ latitude, longitude });

        // 1. 초기 테마를 즉시 설정합니다.
        const initialSunTimes = updateTheme(latitude, longitude);

        // 2. 다음 테마 변경을 스케줄링합니다.
        scheduleNextUpdate(initialSunTimes);
      } catch (error) {
        console.error('동적 그라데이션 설정 실패:', error.message);
        setTimePeriod('day'); // 에러 발생 시 '낮' 테마로 fallback
      }
    };

    initialize();

    // 컴포넌트가 언마운트될 때 타이머를 반드시 정리합니다.
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [updateTheme]); // updateTheme는 useCallback으로 감싸져 있어 한번만 생성됩니다.

  // PALETTE에서 현재 시간대에 맞는 테마 정보를 가져옵니다.
  // 안전하게 기본값을 제공하여 currentTheme이 없는 경우를 대비합니다.
  const currentTheme = PALETTE.themes[timePeriod] || PALETTE.themes.day;

  return {
    colors: [currentTheme.gradient.start, currentTheme.gradient.end],
    statusBar: currentTheme.statusBar,
    state: timePeriod,
    location,
  };
}
