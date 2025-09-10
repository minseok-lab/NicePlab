// contexts/LocationContext.js

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  getWeatherLocationInfo,
  getDefaultRegionInfo,
} from '../utils/locationResolver';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [locationName, setLocationName] = useState('내 위치'); // 위치 이름 상태
  const [locationInfo, setLocationInfo] = useState(null); // 위치 상세 정보 상태
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocationData = async () => {
      setIsLoading(true);
      try {
        const info =
          (await getWeatherLocationInfo(locationName)) ||
          getDefaultRegionInfo();
        setLocationInfo(info);
      } catch (error) {
        console.error('LocationContext에서 위치 정보 로드 실패:', error);
        setLocationInfo(getDefaultRegionInfo()); // 실패 시 기본 정보로 설정
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();
  }, [locationName]); // locationName이 변경될 때마다 이 효과가 다시 실행됩니다.

  // Provider가 전달할 값들을 memoization하여 불필요한 리렌더링을 방지합니다.
  const value = useMemo(
    () => ({
      locationInfo,
      isLoading,
      setLocationName, // 외부에서 위치를 변경할 수 있도록 함수를 제공
    }),
    [locationInfo, isLoading],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

// 외부에서 쉽게 Context 값을 사용할 수 있도록 커스텀 훅을 만듭니다.
export const useLocation = () => useContext(LocationContext);
