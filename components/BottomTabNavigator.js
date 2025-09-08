// components/BottomTabNavigator.js

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';

import { PALETTE } from '../styles';
import { PLAB_FOOTBALL_URL } from '../constants';
import { useDynamicGradient } from '../hooks';
import * as icons from '../../assets/bottomTabBar';

// --- 더미 스크린 ---
// 실제 앱의 스크린 컴포넌트로 교체해 주세요.
const DummyScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
      {route.name} Screen
    </Text>
  </View>
);
const CurrentLocationScreen = () => <DummyScreen route={{ name: '내 위치' }} />;
const SearchScreen = () => <DummyScreen route={{ name: '검색하기' }} />;
// --------------------

const Tab = createBottomTabNavigator();
const currentTheme = 'day'; // 테마는 여기서 동적으로 변경할 수 있습니다.
const theme = PALETTE.themes[currentTheme];

/**
 * 중앙 CTA (Call To Action) 버튼 컴포넌트
 * 다이아몬드 모양과 오프셋 위치를 구현합니다.
 */
const CtaButton = () => {
  const handlePress = () => {
    // 햅틱 피드백 트리거
    HapticFeedback.trigger('selection');
    // 외부 링크 열기
    Linking.openURL(PLAB_FOOTBALL_URL).catch(err =>
      console.error("Couldn't load page", err),
    );
  };

  return (
    <TouchableOpacity
      style={styles.ctaContainer}
      onPress={handlePress}
      accessibilityLabel="PlabFootball 바로가기"
      testID="tab-cta"
    >
      <View style={styles.ctaButton}>
        <Text style={styles.ctaLabel}>P</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * React Navigation에 의해 렌더링될 커스텀 탭 바
 */
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainerWrapper} testID="tabbar-root">
      {/* 중앙 CTA 버튼을 탭 바 위에 배치합니다. */}
      <CtaButton />
      <LinearGradient
        colors={[theme.gradient.start, theme.gradient.end]}
        style={styles.tabBarContainer}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconSource;
          let label = options.title !== undefined ? options.title : route.name;
          let a11yLabel = '';
          let testID = '';

          if (route.name === 'CurrentLocation') {
            label = '내 위치';
            iconSource = myLocationIcon;
            a11yLabel = '내 위치';
            testID = 'tab-home';
          } else if (route.name === 'Search') {
            label = '검색하기';
            iconSource = searchIcon;
            a11yLabel = '검색하기';
            testID = 'tab-search';
          }

          // 중앙 CTA 버튼 공간 확보를 위해 투명 뷰를 렌더링합니다.
          if (index === 1) {
            return <View key="cta-placeholder" style={styles.tabItem} />;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={a11yLabel}
              testID={testID}
              onPress={onPress}
              style={styles.tabItem}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={iconSource}
                style={[
                  styles.tabIcon,
                  { tintColor: theme.textPrimary },
                  isFocused && styles.activeIcon,
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: theme.textPrimary },
                  isFocused && styles.activeLabel,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
};

/**
 * 메인 하단 탭 내비게이터 컴포넌트
 */
const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="CurrentLocation" component={CurrentLocationScreen} />
      {/* CTA 버튼을 위한 더미 스크린. 실제로는 렌더링되지 않음 */}
      <Tab.Screen
        name="CtaDummy"
        component={() => null}
        listeners={{ tabPress: e => e.preventDefault() }}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
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

export default BottomTabNavigator;
