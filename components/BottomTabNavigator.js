// components/BottomTabNavigator.js

import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';

import { getTabNavigatorStyles, PALETTE } from '../styles';
import { PLAB_FOOTBALL_URL } from '../constants';
import * as icons from '../assets/bottomTabBar';
import { useTheme } from '../contexts/ThemeContext';
import CurrentLocationScreen from '../screens/CurrentLocationScreen';

const Tab = createBottomTabNavigator();
/**
 * 중앙 CTA 버튼 컴포넌트
 * 이제 styles를 props로 받아 동적으로 스타일을 적용합니다.
 */
const CtaButton = ({ styles, theme }) => {
  const handlePress = () => {
    HapticFeedback.trigger('selection');
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
      <View style={[styles.ctaButton, { backgroundColor: theme.background }]}>
        <Text style={[styles.ctaLabel, { color: theme.textPrimary }]}>P</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * React Navigation에 의해 렌더링될 커스텀 탭 바
 */
const CustomTabBar = ({ state, descriptors, navigation }) => {
  // 1. useTheme 훅을 호출하여 동적 테마 데이터를 가져옵니다.
  const themeData = useTheme();

  // 2. 테마 데이터가 아직 로딩 중일 경우(초기 상태) 아무것도 렌더링하지 않습니다.
  if (!themeData) {
    return null;
  }

  // 3. themeData에서 필요한 값을 추출합니다.
  const { colors, state: timePeriod } = themeData;
  const theme = PALETTE.themes[timePeriod] || PALETTE.themes.day;
  const styles = getTabNavigatorStyles(theme);

  return (
    <View style={styles.tabBarContainerWrapper} testID="tabbar-root">
      <CtaButton styles={styles} theme={theme} />
      <LinearGradient colors={colors} style={styles.tabBarContainer}>
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
          let label = options.title || route.name;
          let a11yLabel = '';
          let testID = '';

          if (route.name === 'CurrentLocation') {
            label = '내 위치';
            iconSource = icons.myLocation; // ◀◀◀ 아이콘 경로 수정
            a11yLabel = '내 위치';
            testID = 'tab-home';
          } else if (route.name === 'Search') {
            label = '검색하기';
            iconSource = icons.search; // ◀◀◀ 아이콘 경로 수정
            a11yLabel = '검색하기';
            testID = 'tab-search';
          }

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
                  { tintColor: theme.textPrimary }, // 동적 색상 적용
                  isFocused && styles.activeIcon,
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: theme.textPrimary }, // 동적 색상 적용
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

export default BottomTabNavigator;
