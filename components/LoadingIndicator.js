// components/loadingIndicator.js

import { View, ActivityIndicator, Text } from 'react-native';
import { globalStyles as styles } from '../styles';

const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#0000ff" />
    <Text>날씨 데이터를 불러오는 중...</Text>
  </View>
);

export default LoadingIndicator;