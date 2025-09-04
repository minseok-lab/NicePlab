// components/RecommendTimeCard.js

import { View, Text, Image } from 'react-native';
import SunCalc from 'suncalc';
// 👇 WeatherForcastCard 전용 스타일을 import 합니다.
import { useDynamicGradient } from '../hooks';
import { getRecommendTimeCardStyles, PALETTE } from '../styles';
import { formatWeather, getScoreColor, getUvColor, getDustColor } from '../utils';

/**
 * 시간대별 날씨 정보를 표시하는 카드 컴포넌트입니다.
 * (TouchableOpacity로 감싸져서 사용됩니다)
 * @param {object} weatherItem - 특정 시간대의 모든 날씨 정보가 담긴 객체
 */
const RecommendTimeCard = ({ weatherItem, location }) => {
  
  // ▼ 2. 훅을 호출하여 현재 테마를 가져오고, 동적 스타일을 생성합니다.
  const { state } = useDynamicGradient();
  const theme = PALETTE.themes[state];
  const styles = getRecommendTimeCardStyles(theme);
  // ▲

  // 1. 데이터 구조 분해 할당
  const { dt, totalScore, temp, sky, pty, humidity, uvIndex, pm10Grade, pm25Grade } = weatherItem;
  
  // 2. 데이터 가공
  const date = new Date(dt * 1000);
  const dayOfWeek = date.toLocaleString('ko-KR', { weekday: 'short' }); // '월', '화' 등 요일 추출
  const timeStr = `${date.getMonth() + 1}월 ${date.getDate()}일 ${dayOfWeek}요일 ${date.getHours()}시`; // 요일을 문자열에 추가
  let isDay = true; // 기본값은 '낮'으로 설정

  // location 정보가 있을 경우에만 시간대 계산을 수행합니다.
  if (location) {
    const sunTimes = SunCalc.getTimes(date, location.latitude, location.longitude);
    // 해가 떠 있는 시간(일출 ~ 일몰)이면 isDay는 true가 됩니다.
    isDay = date >= sunTimes.sunrise && date < sunTimes.sunset;
  }
  
  // 계산된 isDay 값을 formatWeather에 전달합니다.
  const weather = formatWeather(sky, pty, isDay);
  const validUvIndex = typeof uvIndex === 'number' ? uvIndex : 0;

  // 3. JSX 반환 (⭐ 스타일 이름 및 구조 수정)
  return (
    <>
      {/* 상단: 날짜와 점수 */}
      <View style={styles.header}>
        <Text style={styles.forcastTimeText}>{timeStr}</Text>
        <View style={[styles.scoreBox, { backgroundColor: getScoreColor(totalScore) }]}>
          <Text style={styles.scoreText}>{totalScore.toFixed(1)}</Text>
        </View>
      </View>

      {/* 하단: 상세 날씨 정보 */}
      <View style={styles.content}>
        {/* 👇 1. 온도와 아이콘을 묶는 View */}
        <View style={styles.weatherColumn}>
          <Text style={styles.tempText}>{Math.round(temp)}°</Text>
          <Image source={weather.icon} style={styles.icon} />
        </View>
        
        {/* 👇 2. 상세 정보 (습도, UV 등) */}
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
            <Text style={[styles.detailValuesText, { color: getDustColor(pm10Grade) }]}>{pm10Grade || '정보없음'}</Text>
            <Text style={[styles.detailValuesText, { color: getDustColor(pm25Grade) }]}>{pm25Grade || '정보없음'}</Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default RecommendTimeCard;