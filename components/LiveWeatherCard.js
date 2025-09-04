// components/LiveWeatherCard.js

import { View, Text, Image, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';

// --- 스타일 및 유틸리티 ---
import { useDynamicGradient } from '../hooks';
import { getLiveCardStyles, PALETTE } from '../styles';
import { formatWeather, getScoreColor, getUvColor, getDustColor } from '../utils';
import { NAVER_WEATHER_URL } from '../constants';

/**
 * props로 받은 실시간 날씨 정보를 표시하는 단순 뷰 컴포넌트입니다.
 */
const LiveWeatherCard = ({ liveData, location }) => {
  // ▼ 2. 훅을 호출하여 현재 테마와 상태를 가져옵니다.
  const { state } = useDynamicGradient();
  const theme = PALETTE.themes[state];

  // ▼ 3. 테마를 인자로 전달하여 동적 스타일 객체를 생성합니다.
  const styles = getLiveCardStyles(theme);

  // [변경] props로 받은 liveData가 없으면 로딩 상태를 표시합니다.
  if (!liveData) {
    return (
      <View style={[styles.cardContainer, { justifyContent: 'center', alignItems: 'center', minHeight: 150 }]}>
        <ActivityIndicator size="small" color={theme.statusGood} />
        <Text style={{ marginTop: 10, fontSize: 12, color: theme.textSecondary }}>
          실시간 정보 로딩 중...
        </Text>
      </View>
    );
  }
  
  // 날짜/시간 포맷팅 (렌더링 시점에 계산)
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const formattedDateTime =
    `${now.getMonth() + 1}월 ${now.getDate()}일 ${now.toLocaleString('ko-KR', { weekday: 'long' })} ${hours}:${minutes}`;

  const handleCardPress = () => {
    // 1. location 객체와 위도/경도 값이 있는지 확인합니다.
    if (location && location.latitude && location.longitude) {
      // 2. 위도/경도를 포함한 동적 URL을 생성합니다.
      const dynamicUrl = `https://weather.naver.com/today/?lat=${location.latitude}&lon=${location.longitude}`;
      Linking.openURL(dynamicUrl).catch(err => console.error("URL 열기 실패", err));
    } else {
      // 3. location 정보가 없을 경우, 기존의 기본 URL로 이동합니다. (폴백)
      Linking.openURL(NAVER_WEATHER_URL).catch(err => console.error("URL 열기 실패", err));
    }
  };
  
  const weather = formatWeather(liveData.pty > 0 ? 4 : 1, liveData.pty);
  const { locationName, totalScore, temp, humidity, uvIndex, pm10Grade, pm25Grade } = liveData;
  const validUvIndex = typeof uvIndex === 'number' ? uvIndex : 0;

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
      <View style={styles.cardContainer}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>🗺️ {locationName}</Text>
            <Text style={styles.dateText}>{formattedDateTime}</Text>
          </View>
          <View style={[styles.scoreBox, { backgroundColor: getScoreColor(totalScore) }]}>
            <Text style={styles.scoreText}>{totalScore.toFixed(1)}</Text>
          </View>
        </View>

        {/* 컨텐츠 */}
        <View style={styles.content}>
          <View style={styles.weatherColumn}>
            <Text style={styles.tempText}>{temp.toFixed(1)}°</Text>
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
              <Text style={[styles.detailValuesText, { color: getUvColor(validUvIndex) }]}>{validUvIndex}</Text>
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