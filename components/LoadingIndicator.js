// components/LoadingIndicator.js

import { View, ActivityIndicator, Text } from 'react-native';
// ▼ 1. 훅과 동적 스타일 유틸리티를 import 합니다.
import { useDynamicGradient } from '../hooks';
import { getGlobalStyles, PALETTE } from '../styles';

const LoadingIndicator = () => {
  // ▼ 2. 훅을 호출하여 현재 테마와 스타일을 가져옵니다.
  const { state } = useDynamicGradient();
  const theme = PALETTE.themes[state];
  const styles = getGlobalStyles(theme);

  return (
    // ▼ 3. 동적으로 생성된 스타일과 테마 색상을 적용합니다.
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.textPrimary} />
      <Text style={{ marginTop: 15, color: theme.textSecondary }}>
        날씨 데이터를 불러오는 중...
      </Text>
    </View>
  );
};

export default LoadingIndicator;