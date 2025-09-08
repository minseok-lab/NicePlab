// styles/tabNavigator.styles.js

import { StyleSheet } from 'react-native';

export const getTabNavigatorStyles = theme =>
  StyleSheet.create({
    // --- 탭 바 컨테이너 ---
    tabBarContainerWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 70,
      // iOS 그림자
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      // Android 그림자
      elevation: 8,
    },
    tabBarContainer: {
      flexDirection: 'row',
      height: '100%',
      paddingHorizontal: 10,
      borderTopWidth: 0,
    },
    // --- 일반 탭 아이템 ---
    tabItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44, // 최소 터치 영역
      minWidth: 44,
    },
    tabIcon: {
      width: 24,
      height: 24,
      marginBottom: 4,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '400',
    },
    // --- 활성 상태 스타일 ---
    activeLabel: {
      fontWeight: '600',
    },
    activeIcon: {
      // 폰트가 아닌 이미지라 fontWeight 적용이 안되지만,
      // 필요 시 다른 활성 상태 스타일(예: 크기 변경)을 여기에 추가할 수 있습니다.
    },
    // --- 중앙 CTA 버튼 ---
    ctaContainer: {
      position: 'absolute',
      top: -20, // offsetY: -20
      left: '50%',
      marginLeft: -32, // size(64)의 절반
      width: 64,
      height: 64,
      zIndex: 1,
      // iOS 그림자
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
    },
    ctaButton: {
      width: 64,
      height: 64,
      borderRadius: 12, // 다이아몬드 모양을 위한 약간의 둥글기
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ rotate: '45deg' }],
      // Android 그림자
      elevation: 12,
    },
    ctaLabel: {
      color: theme.textPrimary,
      fontWeight: '700',
      fontSize: 20,
      transform: [{ rotate: '-45deg' }], // 텍스트는 다시 원래 각도로
    },
  });
