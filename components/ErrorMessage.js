// components/ErrorMessage.js

import { Text } from 'react-native';
// ▼ 1. 훅과 동적 스타일 유틸리티를 import 합니다.
import { useDynamicGradient } from '../hooks';
import { getGlobalStyles, PALETTE } from '../styles';

const ErrorMessage = ({ message }) => {
  // ▼ 2. 훅을 호출하여 현재 테마와 스타일을 가져옵니다.
  const { state } = useDynamicGradient();
  const theme = PALETTE.themes[state];
  const styles = getGlobalStyles(theme);

  // ▼ 3. 동적으로 생성된 스타일을 적용합니다.
  return <Text style={styles.error}>{message}</Text>;
};

export default ErrorMessage;
