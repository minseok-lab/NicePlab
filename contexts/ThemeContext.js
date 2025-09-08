// contexts/ThemeContext.js

import { createContext, useContext } from 'react';
import { useDynamicGradient } from '../hooks/useDynamicGradient'; // ◀◀◀ 1. 우리가 만든 훅을 가져옵니다.

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // 2. 테마 계산 전문가(훅)를 호출하여 모든 로직을 위임합니다.
  const themeData = useDynamicGradient();

  // 3. 전문가가 계산한 결과를 Context를 통해 앱 전체에 전파합니다.
  return (
    <ThemeContext.Provider value={themeData}>{children}</ThemeContext.Provider>
  );
};

// 4. 이제 useTheme을 사용하면 themeData 객체({ colors, statusBar, state, location })를 통째로 받게 됩니다.
export const useTheme = () => useContext(ThemeContext);
