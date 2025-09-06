// components/RecommendTimeCard.js

import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import SunCalc from 'suncalc';

import { useDynamicGradient } from '../hooks';
import { getRecommendTimeCardStyles, PALETTE } from '../styles';
import {
  formatWeather,
  getScoreColor,
  getUvColor,
  getDustColor,
} from '../utils';

/**
 * 시간대별 날씨 정보를 표시하는 카드 컴포넌트입니다.
 * (TouchableOpacity로 감싸져서 사용됩니다)
 * @param {object} weatherItem - 특정 시간대의 모든 날씨 정보가 담긴 객체
 */
const RecommendTimeCard = ({ weatherItem, location }) => {
  // 1. 훅을 호출하여 현재 테마를 가져오고, 동적 스타일을 생성합니다.
  const { state } = useDynamicGradient();
  const theme = PALETTE.themes[state];
  const styles = getRecommendTimeCardStyles(theme);

  // 2. 데이터 구조 분해 할당
  const {
    dt,
    totalScore,
    temp,
    sky,
    pty,
    humidity,
    uvIndex,
    pm10Grade,
    pm25Grade,
  } = weatherItem;

  // 3. useMemo를 사용해 props가 변경될 때만 값을 다시 계산합니다.
  const date = useMemo(() => new Date(dt * 1000), [dt]);
  const timeStr = useMemo(() => {
    const dayOfWeek = date.toLocaleString('ko-KR', { weekday: 'short' }); // '월', '화' 등 요일 추출
    return `${
      date.getMonth() + 1
    }월 ${date.getDate()}일 ${dayOfWeek}요일 ${date.getHours()}시`;
  }, [date]);

  // 4. location 정보가 있을 경우에만 시간대 계산을 수행합니다.
  const isDay = useMemo(() => {
    if (location) {
      const sunTimes = SunCalc.getTimes(
        date,
        location.latitude,
        location.longitude,
      );
      // 해가 떠 있는 시간(일출 ~ 일몰)이면 isDay는 true가 됩니다.
      return date >= sunTimes.sunrise && date < sunTimes.sunset;
    }
    return true; // location 정보가 없으면 기본값 true
  }, [date, location]);

  // 계산된 isDay 값을 formatWeather에 전달합니다.
  const weather = useMemo(
    () => formatWeather(sky, pty, isDay),
    [sky, pty, isDay],
  );

  const validUvIndex = typeof uvIndex === 'number' ? uvIndex : 0;

  // 3. JSX 반환 (⭐ 스타일 이름 및 구조 수정)
  return (
    <>
      {/* 상단: 날짜와 점수 */}
      <View style={styles.header}>
        <Text style={styles.forcastTimeText}>{timeStr}</Text>
        <View
          style={[
            styles.scoreBox,
            { backgroundColor: getScoreColor(totalScore) },
          ]}
        >
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
            <Text
              style={[
                styles.detailValuesText,
                { color: getUvColor(validUvIndex) },
              ]}
            >
              {validUvIndex}
            </Text>
            <Text
              style={[
                styles.detailValuesText,
                { color: getDustColor(pm10Grade) },
              ]}
            >
              {pm10Grade || '정보없음'}
            </Text>
            <Text
              style={[
                styles.detailValuesText,
                { color: getDustColor(pm25Grade) },
              ]}
            >
              {pm25Grade || '정보없음'}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

// 4. React.memo로 컴포넌트를 감싸줍니다.
// 이렇게 하면 weatherItem이나 location prop이 변경되지 않는 한, 이 컴포넌트는 리렌더링되지 않습니다.
export default React.memo(RecommendTimeCard);
