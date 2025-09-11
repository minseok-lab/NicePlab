// contexts/LocationContext.js

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getLocationInfo, LOCATION_TYPE } from '../services/LocationService';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  // ⭐ 2. '내 위치' 문자열 대신 LOCATION_TYPE.GPS 상수를 사용합니다.
  const [locationName, setLocationName] = useState(LOCATION_TYPE.GPS);
  const [locationInfo, setLocationInfo] = useState(null); // 위치 상세 정보 상태
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocationData = async () => {
      setIsLoading(true);

      // ⭐ 3. getLocationInfo 서비스 함수를 호출합니다.
      // 서비스 내부에서 에러 처리 및 기본값 반환을 모두 처리하므로,
      // Context에서는 그 결과를 받아서 상태에 반영하기만 하면 됩니다.
      const info = await getLocationInfo(locationName);
      setLocationInfo(info);

      setIsLoading(false);
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
    // locationInfo나 isLoading 상태가 변경될 때만 value 객체를 새로 생성합니다.
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
