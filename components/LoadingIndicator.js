// components/LoadingIndicator.js

import { View, ActivityIndicator, Text } from 'react-native';
// 훅과 동적 스타일 유틸리티를 import 합니다.
import { useDynamicGradient } from '../hooks';
import { getGlobalStyles, PALETTE } from '../styles';

// 1. props로 size와 text를 받고, 기본값을 설정해줍니다.
const LoadingIndicator = ({
  size = 'large',
  text = '날씨 데이터를 불러오는 중...',
}) => {
  const { state } = useDynamicGradient();
  const theme = PALETTE.themes[state];
  const styles = getGlobalStyles(theme);

  return (
    <View style={styles.loadingContainer}>
      {/* 2. props로 받은 size를 적용합니다. */}
      <ActivityIndicator size={size} color={theme.textPrimary} />
      <Text style={styles.loadingText}>
        {/* 3. props로 받은 text를 적용합니다. */}
        {text}
      </Text>
    </View>
  );
};

export default LoadingIndicator;
