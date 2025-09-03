// styles/matchDetails.styles.js

import { StyleSheet } from 'react-native';

export const getMatchDetailsStyles = (theme) => StyleSheet.create({
  // --- 매치 리스트 전체 컨테이너 ---
  matchListContainer: { // ⭐ 이름 통일: listContainer -> matchListContainer
    marginTop: 16,
    marginHorizontal: 8,
    backgroundColor: 'transparent',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.textMuted,
  },

  // --- TouchableOpacity로 감싸는 개별 매치 아이템 ---
  matchItemContainer: { // ⭐ 누락된 스타일 추가
    marginBottom: 12, // 매치 아이템 간의 간격
  },

  // ✨ 추가: 제목과 아이콘을 감싸는 컨테이너 스타일
  titleContainer: {
    flexDirection: 'row',   // 가로로 정렬
    alignItems: 'center',   // 세로 중앙 정렬
    marginBottom: 4,        // 아래 상세 정보와의 간격
  },
  
  // --- 매치 제목 ("⚽️ 실내 풋살") ---
  matchInfoText: { // ⭐ 이름 통일: infoText -> matchInfoText
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: 'bold',
    marginBottom: 4, // 제목과 상세 정보 사이 간격
  },

  // ✨ 추가: matchLink 스타일 (필요에 따라 수정하세요)
  matchLink: {
    
  },

  iconStyle: {
    marginLeft: 5,
    marginBottom : 2,
  },
  // --- 레벨 아이콘과 텍스트를 감싸는 컨테이너 ---
  matchDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // --- "평균 레벨: 아마추어..." 텍스트 ---
  matchDetailsText: { // ⭐ 이름 통일: detailsText -> matchDetailsText
    fontSize: 14,
    color: theme.textMuted,
    flexShrink: 1, // ⭐ 줄바꿈 방지: 텍스트가 길어질 경우 줄어들도록 설정
  },

  // --- 매치 없음 텍스트 ---
  noMatchText: { // ⭐ 이름 변경: centeredText -> noMatchText
    paddingVertical: 10,
    color: theme.textSecondary,
    fontSize: 14,
  },
});