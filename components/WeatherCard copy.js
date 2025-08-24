// components/WeatherCard.js
import { useState, memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../styles/styles';
import { formatWeather, getScoreColor, getUvColor, getDustColor } from '../utils';
import MatchDetails from './MatchDetails';

const WeatherCard = ({ weatherItem, matches }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  // 렌더링에 필요한 데이터 추출
  const { dt: timestamp, totalScore, temp, sky, pty, humidity, uvIndex } = weatherItem;
  const date = new Date(timestamp * 1000);
  const timeStr = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시`;
  const weather = formatWeather(sky, pty);
  const validUvIndex = typeof uvIndex === 'number' ? uvIndex : 0;

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handleToggle}
      activeOpacity={0.8}
    >
      {/* 카드 헤더 */}
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{timeStr}</Text>
        <View style={[styles.scoreBox, { backgroundColor: getScoreColor(totalScore) }]}>
          <Text style={styles.scoreText}>{totalScore.toFixed(1)}</Text>
        </View>
      </View>

      {/* 날씨 정보 */}
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
            <Text style={[styles.detailValuesText, { color: getDustColor(weatherItem.pm10Grade) }]}>
              {weatherItem.pm10Grade || '정보없음'}
            </Text>
            <Text style={[styles.detailValuesText, { color: getDustColor(weatherItem.pm25Grade) }]}>
              {weatherItem.pm25Grade || '정보없음'}
            </Text>
          </View>
        </View>
      </View>

      {/* 펼쳤을 때 보이는 매치 상세 정보 */}
      {isExpanded && <MatchDetails matches={matches} />}
    </TouchableOpacity>
  );
};

export default memo(WeatherCard);