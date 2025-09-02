// styles/colors.js
// 앱 전체에서 사용할 색상을 변수로 관리하여 일관성을 유지합니다.

// 1. 공통 색상 정의 (테마에 따라 변하지 않는 값)
const common = {
  white: '#ffffff',
  black: '#0c0c0c',
  
  // 상태(Status) 색상은 테마와 상관없이 일관성을 유지
  statusGood: '#0040D3',
  statusModerate: '#35B847',
  statusWarning: '#FBCE33',
  statusBad: '#E16F24',
  statusVeryBad: '#C60F14',

  // 기타
  error: 'red',
  border: '#aaa',
};

// 2. 테마별 색상 정의 (시간 상태에 따라 변하는 값)
const themes = {
  // --- 낮 테마 ---
  day: {
    background: '#fdfdfd',
    textPrimary: '#333333',
    textSecondary: '#666666',
    textMuted: '#888888',
    cardBackground: '#468dd955',
    gradient: { start: '#468DD9', end: '#61CBF4' },
    statusBar: 'dark-content',
  },

  // --- 밤 테마 ---
  night: {
    background: '#0c0c0c',
    textPrimary: '#ffffff',
    textSecondary: '#bbbbbb',
    textMuted: '#999999',
    cardBackground: '#1e1e1e55',
    gradient: { start: '#0F2027', end: '#5F6B9E' },
    statusBar: 'light-content',
  },

  // --- 일출 & 일몰 테마 ---
  // 밤 테마와 UI 요소 색상을 공유하지만, 그라데이션만 다르게 설정
  evening: {
    background: '#0c0c0c',
    textPrimary: '#ffffff',
    textSecondary: '#bbbbbb',
    textMuted: '#999999',
    cardBackground: '#bd596c54',
    statusBar: 'light-content',
  }
};

// 3. 최종 PALETTE 객체 조합 및 내보내기
export const PALETTE = {
  // 공통 색상에 쉽게 접근할 수 있도록 root에 추가
  common,
  
  // 각 테마에 공통 색상과 고유 색상을 결합하여 완전한 테마 객체를 생성
  themes: {
    day: {
      ...common,
      ...themes.day,
    },
    night: {
      ...common,
      ...themes.night,
    },
    sunrise: {
      ...common,
      ...themes.evening,
      gradient: { start: '#61CBF4', end: '#E96443' }, // 그라데이션만 재정의
    },
    sunset: {
      ...common,
      ...themes.evening,
      gradient: { start: '#5F6B9E', end: '#B3717D' }, // 그라데이션만 재정의
    },
  },
};