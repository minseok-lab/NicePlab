// components/WeatherCard.js

import { View, Text, Image } from 'react-native';
import { styles } from '../styles/styles';
import { formatWeather, getScoreColor, getUvColor, getDustColor } from '../utils';

/**
 * 시간대별 날씨 정보를 표시하는 카드 컴포넌트입니다.
 * @param {object} weatherItem - 특정 시간대의 모든 날씨 정보가 담긴 객체
 */
const WeatherCard = ({ weatherItem }) => {
  
  // 1. 필요한 데이터를 weatherItem에서 구조 분해 할당합니다.
  const { dt, totalScore, temp, sky, pty, humidity, uvIndex, pm10Grade, pm25Grade } = weatherItem;
  
  // 2. UI에 필요한 형태로 데이터를 가공합니다.
  const date = new Date(dt * 1000);
  const timeStr = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시`;
  const weather = formatWeather(sky, pty);
  const validUvIndex = typeof uvIndex === 'number' ? uvIndex : 0;

  // 3. JSX를 반환합니다. 이 컴포넌트는 TouchableOpacity를 포함하지 않습니다.
  return (
    <>
      {/* 상단: 날짜와 점수 */}
      <View style={styles.cardHeader}>
        <Text style= {styles.dateText}>{timeStr}</Text>
        <View style={[styles.scoreBox, { backgroundColor: getScoreColor(totalScore) }]}>
          <Text style={styles.scoreText}>{totalScore.toFixed(1)}</Text>
        </View>
      </View>

      {/* 하단: 상세 날씨 정보 */}
      <View style={styles.weatherContent}>
        <View style={styles.weatherColumn}>
          <Text style={styles.tempText}>{Math.round(temp)}°</Text>
        </View>
        <Image source={weather.icon} style={styles.weatherIcon} />
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

export default WeatherCard;