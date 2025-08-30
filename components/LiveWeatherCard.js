// components/LiveWeatherCard.js

import { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';

// --- 스타일 및 유틸리티 ---
import { liveCardStyles as styles } from '../styles';
// 👇 getUvColor와 getDustColor를 다시 import 합니다.
import { formatWeather, getScoreColor, getUvColor, getDustColor, getDustGradeFromValue } from '../utils'; 
import { getScoreDetailsForHour } from '../utils/exercise/scoreCalculator';
import { seasonScoreCriteria } from '../configs/exerciseScoreCriteria';

// --- API 및 위치 서비스 ---
import { getWeatherLocationInfo } from '../utils/locationUtils';
import { fetchKmaLiveWeather } from '../api/weatherLiveApi';
import { fetchCurrentAirQuality, fetchCai } from '../api/airQualityApi';
import { fetchUvIndexForcast } from '../api/uvApi';
import { useWeather } from '../hooks/useWeather';


/**
 * 현재 위치의 실시간 날씨, 대기질, 자외선 정보를 종합하여 표시하는 카드 컴포넌트입니다.
 */
const LiveWeatherCard = () => {
  
  const [liveData, setLiveData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentDisplayDateTime, setCurrentDisplayDateTime] = useState('');
  const { season } = useWeather();

  // 날짜/시간 포맷팅
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const month = now.getMonth() + 1; // 월
      const date = now.getDate(); // 일
      const day = now.toLocaleString('ko-KR', { weekday: 'long' }); // 요일
      
      const hours = String(now.getHours()).padStart(2, '0'); // 시간 (2자리)
      const minutes = String(now.getMinutes()).padStart(2, '0'); // 분 (2자리)

      // 명확하게 원하는 형식으로 문자열을 조합합니다.
      const formattedDateTime = `${month}월 ${date}일 ${day} ${hours}:${minutes}`;
      
      setCurrentDisplayDateTime(formattedDateTime);
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 600000); // 10분마다 시간 업데이트
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadAllLiveData = async () => {
      // ✨ 3. 'season' 값이 아직 로딩 중일 수 있으므로, 방어 코드를 추가합니다.
      // useWeather 훅이 아직 계절을 계산 중이면 'summer'를 기본값으로 사용합니다.
      if (!season) return; // season 값이 준비될 때까지 잠시 대기

      try {
      // 🚨 중요: locationInfo가 stationName을 포함하도록 수정되어야 합니다.
      const locationInfo = await getWeatherLocationInfo("내 위치");
      if (!locationInfo || !locationInfo.stationName) {
        throw new Error('위치 정보 또는 측정소 정보를 가져올 수 없습니다.');
      }
      
      // 👇 [변경] API 호출 부분을 수정합니다.
      const [liveWeather, airQuality, uvForcast] = await Promise.all([
        fetchKmaLiveWeather(locationInfo.grid),
        // fetchAirQualityForcast 대신 fetchCurrentAirQuality 사용
        fetchCurrentAirQuality(locationInfo.stationName), 
        fetchUvIndexForcast(locationInfo.areaNo)
      ]);

      if (!liveWeather) throw new Error('실시간 날씨 정보를 가져오는데 실패했습니다.');

      const currentHour = new Date().getHours();
      const currentUvIndex = uvForcast?.hourlyUv?.[currentHour] ?? '정보없음';

        // 👇 [변경] API 응답 데이터를 처리하는 부분을 수정합니다.
      const combinedData = {
        locationName: locationInfo.currentCity,
        ...liveWeather,
        // getDustGradeFromValue를 사용해 수치를 등급으로 변환합니다.
        pm10Grade: getDustGradeFromValue('pm10', airQuality?.pm10Value),
        pm25Grade: getDustGradeFromValue('pm25', airQuality?.pm25Value),
        uvIndex: currentUvIndex,
      };
        
        // ✨ 4. useWeather 훅에서 가져온 'season'을 사용합니다.
        const currentWeights = seasonScoreCriteria[season];
        
        // 1. 새로 만든 함수를 호출하여 모든 점수가 담긴 객체를 받습니다.
        const allScores = getScoreDetailsForHour(combinedData, currentWeights, season);

        // 2. 기존 데이터에 점수 객체를 합쳐서 최종 데이터를 만듭니다.
        const finalData = { ...combinedData, ...allScores };

        setLiveData(finalData);

      } catch (error) {
        console.error("LiveWeatherCard Error:", error);
        setErrorMsg(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllLiveData();
  }, [season]);

  const handleCardPress = () => {
    const url = "https://weather.naver.com/today/";
    // Linking.openURL을 사용해 외부 브라우저로 URL을 엽니다.
    Linking.openURL(url).catch(err => console.error("URL을 여는 데 실패했습니다.", err));
  };

  // --- 렌더링 로직 ---

  if (isLoading) {
    return (
      <View style={[styles.cardContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0040D3" />
        <Text style={{ marginTop: 10 }}>실시간 날씨 정보를 불러오고 있습니다...</Text>
      </View>
    );
  }

  if (errorMsg || !liveData) {
    return (
      <View style={[styles.cardContainer, { alignItems: 'center', justifyContent: 'center', minHeight: 150 }]}>
        <Text style={styles.errorText}>데이터 로딩 실패</Text>
        <Text style={styles.errorDetails}>{errorMsg || '정보를 표시할 수 없습니다.'}</Text>
      </View>
    );
  }

  const weather = formatWeather(liveData.pty > 0 ? 4 : 1, liveData.pty);
  const { locationName, totalScore, temp, humidity, uvIndex, pm10Grade, pm25Grade } = liveData;

  // getUvColor 함수에 안전하게 값을 전달하기 위해 숫자 타입으로 변환
  const validUvIndex = typeof uvIndex === 'number' ? uvIndex : 0;

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
      <View style={styles.cardContainer}>
        {/* 상단: 지역명, 현재 시간, 점수 */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
              <Text style={styles.locationText}>🗺️ {locationName}</Text>
              <Text style={styles.dateText}>{currentDisplayDateTime}</Text>
          </View>
          <View style={[styles.scoreBox, { backgroundColor: getScoreColor(totalScore) }]}>
            <Text style={styles.scoreText}>{totalScore.toFixed(1)}</Text>
          </View>
        </View>

        {/* 하단: 상세 날씨 정보 */}
        <View style={styles.content}>
          <View style={styles.weatherColumn}>
            <Text style={styles.tempText}>{Math.round(temp)}°</Text>
            <Image source={weather.icon} style={styles.icon} />
          </View>
          <View style={styles.detailsContainer}>
            <View style={styles.detailLabels}>
              <Text style={styles.detailLabelsText}>습도</Text>
              <Text style={styles.detailLabelsText}>UV</Text>
              <Text style={styles.detailLabelsText}>미세먼지</Text>
              <Text style={styles.detailLabelsText}>초미세먼지</Text>
            </View>
            <View style={styles.detailValues}>
              <Text style={styles.detailValuesText}>{humidity}%</Text>
              {/* 👇 [수정] getUvColor와 getDustColor 함수를 사용하여 동적 스타일 적용 */}
              <Text style={[styles.detailValuesText, { color: getUvColor(validUvIndex) }]}>{uvIndex}</Text>
              <Text style={[styles.detailValuesText, { color: getDustColor(pm10Grade) }]}>{pm10Grade}</Text>
              <Text style={[styles.detailValuesText, { color: getDustColor(pm25Grade) }]}>{pm25Grade}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LiveWeatherCard;