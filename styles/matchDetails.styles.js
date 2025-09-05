// styles/matchDetails.styles.js

import { StyleSheet } from 'react-native';

export const getMatchDetailsStyles = theme =>
  StyleSheet.create({
    // --- 매치 리스트 전체 컨테이너 ---
    matchListContainer: {
      // ⭐ 이름 통일: listContainer -> matchListContainer
      marginTop: 16,
      marginHorizontal: 8,
      backgroundColor: 'transparent',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.textMuted,
    },

    // --- TouchableOpacity로 감싸는 개별 매치 아이템 ---
    matchItemContainer: {
      // ⭐ 누락된 스타일 추가
      marginTop: 4,
      marginBottom: 8, // 매치 아이템 간의 간격
    },

    // ✨ 추가: 제목과 아이콘을 감싸는 컨테이너 스타일
    titleContainer: {
      flexDirection: 'row', // 가로로 정렬
      alignItems: 'center', // 세로 중앙 정렬
      marginBottom: 4, // 아래 상세 정보와의 간격
      // ✨ FIX: 공간이 부족하면 자식 요소(아이콘)들이 다음 줄로 넘어가도록 설정합니다.
      flexWrap: 'wrap',
    },

    // --- 매치 제목 ("⚽️ 실내 풋살") ---
    matchInfoText: {
      // ⭐ 이름 통일: infoText -> matchInfoText
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: 'bold',
      // ✨ FIX 1: 텍스트의 줄 높이를 폰트 크기와 비슷하게 설정하여 상하 여백을 줄입니다.
      lineHeight: 18,
      marginRight: 5,
      // ✨ FIX 2: (Android) 폰트 자체의 여백을 제거합니다.
      includeFontPadding: false,
    },

    // ✨ 추가: matchLink 스타일 (필요에 따라 수정하세요)
    matchLink: {},
    // ✨ FIX: 1. 공통 스타일의 이름을 baseIconStyle로 변경합니다.
    baseIconStyle: {
      marginRight: 2,
    },

    // ✨ FIX: 2. 얼리버드 아이콘을 위한 미세 조정 스타일을 추가합니다.
    earlybirdIconStyle: {
      transform: [{ translateY: 1 }], // 파란 동그라미 아이콘을 살짝 내립니다.
    },

    // ✨ FIX: 3. 티셔츠 아이콘을 위한 미세 조정 스타일을 추가합니다.
    tshirtIconStyle: {
      transform: [{ translateY: 6.5 }], // 티셔츠 아이콘을 내립니다.
      marginBottom: -10, // 아이콘 아래 여백을 제거합니다.
    },
    // --- 레벨 아이콘과 텍스트를 감싸는 컨테이너 ---
    matchDetailsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    // --- "평균 레벨: 아마추어..." 텍스트 ---
    matchDetailsText: {
      // ⭐ 이름 통일: detailsText -> matchDetailsText
      fontSize: 14,
      color: theme.textMuted,
      flexShrink: 1, // ⭐ 줄바꿈 방지: 텍스트가 길어질 경우 줄어들도록 설정
    },

    // --- 매치 없음 텍스트 ---
    noMatchText: {
      // ⭐ 이름 변경: centeredText -> noMatchText
      paddingVertical: 10,
      color: theme.textSecondary,
      fontSize: 14,
    },
  });
