// contexts/ThemeContext.js

import { createContext, useContext, useMemo } from 'react';
import { useDynamicGradient } from '../hooks/useDynamicGradient';
import { useLocation } from './LocationContext'; // ✨ useLocation import 추가

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { locationInfo } = useLocation(); // ✨ 1. LocationContext에서 원본 위치 정보를 가져옵니다.
  const themeValues = useDynamicGradient(); // ✨ 2. 훅에서 순수한 테마 값들을 가져옵니다.

  const themeData = useMemo(() => {
    // UI에서 사용하기 좋은 형태로 location 객체를 가공합니다.
    const location = locationInfo
      ? {
          name: locationInfo.currentCity,
          region: locationInfo.region,
          latitude: locationInfo.coords.latitude,
          longitude: locationInfo.coords.longitude,
        }
      : null;

    return {
      ...themeValues, // colors, statusBar, state, daylightInfo 포함
      location, // 가공된 location 객체 추가
    };
  }, [locationInfo, themeValues]); // 두 정보가 변경될 때만 객체를 재생성합니다.

  // 3. 전문가가 계산한 결과를 Context를 통해 앱 전체에 전파합니다.
  return (
    <ThemeContext.Provider value={themeData}>{children}</ThemeContext.Provider>
  );
};

// 4. 이제 useTheme을 사용하면 themeData 객체({ colors, statusBar, state, location })를 통째로 받게 됩니다.
export const useTheme = () => useContext(ThemeContext);
