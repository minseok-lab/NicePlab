/*
// components/WeatherCard.js

import { View, Text, Image } from 'react-native';
import { styles } from '../styles/styles';
import { getWeatherIcon } from '../utils/weatherFormatter';
import { getScoreColor, getUvColor, getDustColor } from '../utils/colorFormatter';

export const WeatherCard = ({ item }) => {
  if (!item) return null;

  const { date, time, temp, sky, pty, score, humidity, uv_index, pm10_grade, pm25_grade } = item;
  
  // 날짜 포맷팅 (예: "8월 24일 20시")
  const dateObj = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`);
  const formattedDate = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 ${time.slice(0, 2)}시`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <View style={[styles.scoreBox, { backgroundColor: getScoreColor(score) }]}>
          {/* 점수를 소수점 한 자리까지 표시 *//*} 
          <Text style={styles.scoreText}>{score.toFixed(1)}</Text>
        </View>
      </View>
      
      <View style={styles.weatherContent}>
        {/* 왼쪽: 온도와 아이콘 *//*}
        <View style={styles.weatherColumn}>
          <Text style={styles.tempText}>{temp}°</Text>
          <Image source={getWeatherIcon(sky, pty)} style={styles.weatherIcon} />
        </View>
        
        {/* 오른쪽: 상세 정보 *//*}
        <View style={styles.weatherColumn}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailLabels}>
              <Text style={styles.detailLabelsText}>습도</Text>
              <Text style={styles.detailLabelsText}>UV</Text>
              <Text style={styles.detailLabelsText}>미세먼지</Text>
              <Text style={styles.detailLabelsText}>초미세먼지</Text>
            </View>
            <View style={styles.detailValues}>
              <Text style={styles.detailValuesText}>{humidity}%</Text>
              <Text style={[styles.detailValuesText, { color: getUvColor(uv_index) }]}>{uv_index}</Text>
              <Text style={[styles.detailValuesText, { color: getDustColor(pm10_grade) }]}>{pm10_grade}</Text>
              <Text style={[styles.detailValuesText, { color: getDustColor(pm25_grade) }]}>{pm25_grade}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

*/