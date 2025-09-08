// styles/liveWeatherCard.styles.js
import { StyleSheet } from 'react-native';

export const getLiveCardStyles = theme =>
  StyleSheet.create({
    // --- 카드 컨테이너 ---
    cardContainer: {
      backgroundColor: 'transparent', // 1. 배경을 투명하게 변경
      padding: 16, // 3. 예보 카드와 동일한 패딩
      marginTop: -28,
      marginBottom: 4,
      marginHorizontal: 15,
      borderRadius: 16,
      // 2. 그림자 효과(elevation, shadow) 속성 제거
    },
    // ▼ [추가] 로딩 상태일 때의 컨테이너 스타일을 정의합니다.
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 150,
    },
    // --- 상단 영역 ---
    // 예보 카드와 동일한 레이아웃을 위해 스타일 이름을 통일합니다.
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    // LiveWeatherCard 고유의 스타일
    locationContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    locationText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 4,
    },
    dateText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    scoreBox: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 12,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.white, // 점수 텍스트는 항상 흰색 유지
    },

    // --- 하단 영역 (날씨 정보) ---
    content: {
      // ⭐ 수정: weatherContent -> content
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between', // 자식 요소들을 양 끝으로 분산
    },
    weatherColumn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tempText: {
      fontSize: 40,
      fontWeight: '400',
      color: theme.textPrimary,
      marginRight: 10,
    },
    icon: {
      // ⭐ 수정: weatherIcon -> icon
      width: 48,
      height: 48,
      resizeMode: 'contain',
      marginLeft: 15,
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
      color: theme.textPrimary,
      fontWeight: '600',
      lineHeight: 22,
    },
  });
