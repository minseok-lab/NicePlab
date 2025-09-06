// styles/matchFilter.styles.js

import { StyleSheet } from 'react-native';

export const getMatchFilterStyles = theme => {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 10,
      // zIndex를 설정하여 드롭다운 메뉴가 다른 컴포넌트 위에 표시되도록 합니다.
      zIndex: 1000,
    },
    pickerContainer: {
      flex: 1,
    },
    // react-native-dropdown-picker의 스타일 옵션입니다.
    dropdownStyle: {
      backgroundColor: theme.background,
      borderColor: theme.border,
    },
    listItemStyle: {
      justifyContent: 'flex-start',
    },
    placeholderStyle: {
      color: theme.textSecondary,
    },
    textStyle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
};
