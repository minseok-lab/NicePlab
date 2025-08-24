// styles/styles.js

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // --- 1. 전체 컨테이너 및 기본 스타일 ---
  container: { // 1) 전체 화면 컨테이너
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fdfdfd',
  },
  logo: { // 2) NicePlab 로고 스타일
    width: 168.5,
    height: 27.5,
    alignSelf: 'left',
    marginBottom: 10,
  },
  subHeader: { // 3) 서브 헤더 스타일
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
    textAlign: 'left',
  },
  loadingContainer: { // 4) 로딩 인디케이터 컨테이너
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { // 5) 날씨 정보 카드 스타일
    backgroundColor: '#eeeeeeff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  
  // --- 2. 상단 영역 (날짜 + 점수) ---
  cardHeader: { // 1) 카드 헤더 컨테이너
    flexDirection: 'row',
    justifyContent: 'space-between', // ✨ 양쪽 끝으로 요소를 배치
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: { // 2) 날짜 텍스트 스타일
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c0c0c',
    marginTop: 2.5,
  },
  scoreBox: { // 3) 점수 박스 스타일
    paddingHorizontal: 12, 
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: { // 4) 점수 텍스트 스타일
    fontSize: 16, // 
    fontWeight: 'bold',
    color: '#fff',
  },

  // --- 3. 하단 영역 (날씨 정보) ---
  weatherContent: { // 1) 하단 전체 컨테이너
    flex: 1, // 남은 공간을 모두 차지
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 4분할 컨테이너의 각 컬럼
  weatherColumn: { // 2) 기온, 아이콘 컬럼
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempText: { // 3) 기온 텍스트
    fontSize: 42,
    fontWeight: '300', // 너무 두껍지 않게
    fontWeight: 'semibold',
    marginRight: 15,
    marginBottom: 5,
  },
  weatherIcon: { // 4)날씨 아이콘 스타일
    width: 50,   // 너비
    height: 50,  // 높이
    resizeMode: 'contain', // 이미지 비율 유지하며 크기 조정
    marginRight: 15, // 아이콘과 상세 정보 사이의 간격
  },
  detailsContainer: { // 5) 습도, 미세먼지 등 상세 정보 컨테이너
    flexDirection: 'row',
    justifyContent: 'space-between', // ✨ [변경] 요소들 사이에 균등한 공간 배분
    paddingHorizontal: 10,
  },
  detailLabels: { // 6) 습도', 'UV' 등 텍스트 라벨 컨테이너
    alignItems: 'flex-start', // 왼쪽 정렬 유지
    marginRight: 27, // ✨ [추가] 라벨과 값 사이의 간격 조절 (기존 간격의 50% 수준)
  },
  detailValues: { // 7) 수치 컨테이너
    alignItems: 'flex-end', // 오른쪽 정렬 유지
  },
  detailLabelsText: { // 8) 상세 정보명 텍스트 기본 스타일
    fontSize: 14,
    marginVertical: 2,
    color: '#555',
  },
  detailValuesText: { // 9) 상세 정보 수치 텍스트 기본 스타일
    fontSize: 14,
    marginVertical: 2,
    color: '#555',
    fontWeight: '600',
  },

  // --- 4. PLAB 경기 정보 영역 ---
  matchListContainer: { // 1) 경기 정보 리스트 컨테이너
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#aaa',
  },
  matchInfoText: { // 2) "오늘의 PLAB 경기" 텍스트 스타일
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
    marginTop: 10,
  },
  matchDetailsContainer: { // 3) 경기 상세 정보 컨테이너
    flexDirection: 'row', // 아이콘과 텍스트를 가로로 나란히 배치
    alignItems: 'center',
    marginTop: 4,
  },
  matchDetailsText: { // 4) 경기 상세 정보 텍스트 스타일
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  matchLink: { // 5) 경기 링크 텍스트 스타일 (기본 스타일과 동일)
    color: '#555',
  },

  // --- 5. 더 많은 매치 보러가기 버튼 ---
  buttonContainer: { // 1) 버튼 컨테이너
    marginTop: 20,
    marginBottom: 20,
  },

  // --- 6. 에러 및 데이터 없음 메시지 ---
  error: { // 1) 에러 메시지 스타일
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  noDataText: { // 2) 데이터 없음 메시지 스타일
    textAlign: 'center',
    fontSize: 16,
    marginTop: 30,
    color: '#666',
  },

  // --- 7. 출처 표시를 위한 푸터 스타일 ---
  footerContainer: { // 버튼과의 간격은 buttonContainer의 marginBottom으로 처리됩니다.
    marginBottom: 0, // 스크롤 맨 아래쪽 여백
  },
  footerText: { // 1) 출처 텍스트 스타일
    fontSize: 10, // 작은 글씨 크기
    color: '#888', // 회색 텍스트
  }
});
