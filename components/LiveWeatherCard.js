// components/LiveWeatherCard.js

import { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';

// --- 스타일 및 유틸리티 ---
import { liveCardStyles as styles } from '../styles';
// 👇 getUvColor와 getDustColor를 다시 import 합니다.
import { formatWeather, getScoreColor, getUvColor, getDustColor } from '../utils'; 
import { calculateScoreForHour } from '../utils/exercise/scoreCalculator';
import { getSeason } from '../utils/getSeason';
import { seasonScoreCriteria } from '../configs/exerciseScoreCriteria';

// --- API 및 위치 서비스 ---
import { getWeatherLocationInfo } from '../utils/locationUtils';
import { fetchKmaLiveWeather } from '../api/weatherLiveApi';
import { fetchAirQualityForcast } from '../api/airQualityApi';
import { fetchUvIndexForcast } from '../api/uvApi';


/**
 * 현재 위치의 실시간 날씨, 대기질, 자외선 정보를 종합하여 표시하는 카드 컴포넌트입니다.
 */
const LiveWeatherCard = () => {
  
  const [liveData, setLiveData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentDisplayDateTime, setCurrentDisplayDateTime] = useState('');

  // 날짜/시간 포맷팅
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = { month: 'numeric', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false };
      setCurrentDisplayDateTime(now.toLocaleString('ko-KR', options).replace(' ', '일 '));
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadAllLiveData = async () => {
      try {
        const locationInfo = await getWeatherLocationInfo("내 위치");
        if (!locationInfo) throw new Error('위치 정보를 가져올 수 없습니다.');
        
        const [liveWeather, airQuality, uvForcast] = await Promise.all([
          fetchKmaLiveWeather(locationInfo.grid),
          fetchAirQualityForcast(locationInfo.currentCity),
          fetchUvIndexForcast(locationInfo.areaNo)
        ]);

        if (!liveWeather) throw new Error('실시간 날씨 정보를 가져오는데 실패했습니다.');

        const currentHour = new Date().getHours();
        const currentUvIndex = uvForcast?.hourlyUv?.[currentHour] ?? '정보없음';

        const combinedData = {
          locationName: locationInfo.currentCity,
          ...liveWeather,
          pm10Grade: airQuality?.pm10 || '정보없음',
          pm25Grade: airQuality?.pm25 || '정보없음',
          uvIndex: currentUvIndex,
        };
        
        const season = getSeason();
        const currentWeights = seasonScoreCriteria[season];
        combinedData.totalScore = calculateScoreForHour(combinedData, currentWeights, season);

        setLiveData(combinedData);

      } catch (error) {
        console.error("LiveWeatherCard Error:", error);
        setErrorMsg(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllLiveData();
  }, []);

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
    <View style={styles.cardContainer}>
      {/* 상단: 지역명, 현재 시간, 점수 */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{locationName}</Text>
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
  );
};

export default LiveWeatherCard;