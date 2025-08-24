// components/Toast.js
import { useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

const Toast = ({ message, onDismiss }) => {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // 메시지가 있을 때만 애니메이션 실행
    if (message) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(4000), // 4초 동안 보여줌
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss(); // 애니메이션이 끝나면 메시지 닫기 함수 호출
      });
    }
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Toast;
