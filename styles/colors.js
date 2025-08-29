// styles/colors.js
// 앱 전체에서 사용할 색상을 변수로 관리하여 일관성을 유지합니다.

export const PALETTE = {
  // 기본 색상
  white: '#ffffff',
  black: '#0c0c0c',
  background: '#fdfdfd',
  
  // 텍스트 색상
  textPrimary: '#333',
  textSecondary: '#666',
  textMuted: '#888',

  // 카드 및 UI 요소
  cardBackground: '#eeeeeeff',
  cardShadow: '#000',
  transparentCard: 'rgba(255, 255, 255, 1)',
  
  // ✨ [수정] 상태(Status) 색상을 여기에 통합하여 관리합니다.
  statusGood: '#0040D3',      // 좋음 (파랑)
  statusModerate: '#35B847', // 보통 (초록)
  statusWarning: '#FBCE33',  // 경고 (노랑)
  statusBad: '#E16F24',      // 나쁨 (주황)
  statusVeryBad: '#C60F14',  // 매우 나쁨 (빨강)

  // 기타 색상
  error: 'red',
  border: '#aaa',
};