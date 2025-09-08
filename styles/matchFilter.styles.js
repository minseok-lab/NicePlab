// styles/matchFilter.styles.js

import { StyleSheet } from 'react-native';

export const getMatchFilterStyles = theme => {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      borderRadius: 32,
      marginTop: 8,
      marginBottom: 16,
      gap: 10,
      // zIndex를 설정하여 드롭다운 메뉴가 다른 컴포넌트 위에 표시되도록 합니다.
      zIndex: 9999,
    },
    pickerContainer: {
      flex: 1,
      zIndex: 9999, // 드롭다운이 다른 요소 위에 표시되도록 보장
    },
    // react-native-dropdown-picker의 스타일 옵션입니다.
    dropdownStyle: {
      backgroundColor: theme.background,
      borderColor: theme.border,
      borderRadius: 32,
    },
    dropDownContainerStyle: {
      // 라이브러리 prop 이름에 맞춰 수정
      backgroundColor: theme.background,
      borderColor: theme.border,
      // ✨ 변경점: 펼쳐지는 메뉴의 테두리도 둥글게 만듭니다.
      borderRadius: 32,
      zIndex: 9999, // 드롭다운이 다른 요소 위에 표시되도록 보장
    },
    placeholderStyle: {
      color: theme.textSecondary,
      textAlign: 'center',
    },
    textStyle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
};
