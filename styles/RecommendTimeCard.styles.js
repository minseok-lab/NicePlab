// styles/RecommendTimeCard.styles.js
import { StyleSheet } from 'react-native';

export const getRecommendTimeCardStyles = theme =>
  StyleSheet.create({
    // --- 카드 컨테이너 ---
    cardContainer: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 20,
      borderRadius: 16,
    },

    // --- 상단 영역 (시간 + 점수) ---
    header: {
      // ⭐ 수정: cardHeader -> header
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      marginHorizontal: 4,
    },
    forcastTimeText: {
      // ⭐ 수정: dateText -> forcastTimeText (명확한 이름)
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    scoreBox: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.white,
    },

    // --- 하단 영역 (날씨 정보) ---
    content: {
      // ⭐ 수정: weatherContent -> content
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between', // 자식 요소들을 양 끝으로 분산
      marginHorizontal: 8,
    },
    weatherColumn: {
      // ⭐ 수정: 온도와 아이콘을 묶는 컨테이너
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 4,
    },
    tempText: {
      fontSize: 40,
      fontWeight: '500',
      color: theme.textPrimary,
      marginRight: 30, // 온도와 아이콘 사이 간격
    },
    icon: {
      // ⭐ 수정: weatherIcon -> icon (LiveWeatherCard와 통일)
      width: 48,
      height: 48,
      resizeMode: 'contain',
    },
    detailsContainer: {
      flexDirection: 'row',
    },
    detailLabels: {
      alignItems: 'flex-start',
      marginRight: 15,
    },
    detailValues: {
      alignItems: 'flex-end',
    },
    detailLabelsText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    detailValuesText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '600',
      lineHeight: 22,
    },
  });
