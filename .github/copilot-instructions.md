
# Copilot 지침서 (NicePlab)

## 개요
NicePlab은 위치와 날씨 데이터를 바탕으로 풋살하기 좋은 시간과 장소를 추천하고, 해당 조건에 맞는 인근 '플랩풋볼' 매치를 보여주는 React Native 앱입니다. 외부 API와 연동하여 다양한 정보를 제공합니다.

## 아키텍처
- **진입점:** `App.js`에서 컨텍스트 프로바이더(`LocationProvider`, `ThemeProvider`)로 앱 전체를 감싸고, 네비게이션을 설정합니다.
- **네비게이션:** `components/BottomTabNavigator.js`에서 하단 탭 네비게이션을 관리합니다.
- **화면:** `screens/` 폴더에 주요 화면 컴포넌트가 위치합니다 (`CurrentLocationScreen.js`, `SearchScreen.js` 등).
- **API 레이어:** 모든 외부 API 호출은 `api/` 폴더에 위치한 모듈에서 처리합니다 (`airQualityApi.js`, `weatherLiveApi.js` 등).
- **컨텍스트:** 위치, 테마 등 공유 상태는 `contexts/`에서 관리합니다.
- **컴포넌트:** UI 요소는 `components/`에 위치하며, 로직과 프레젠테이션을 분리하는 패턴을 따릅니다.
- **스타일:** 스타일 관련 파일은 `styles/`에 집중되어 있습니다.
- **상수:** 공통 설정 및 참조 테이블은 `constants/`에 위치합니다.
- **유틸:** 데이터 변환, 포맷팅 등 헬퍼 함수는 `utils/`에 위치합니다.

## 개발 워크플로우
- **앱 실행:** `npx expo start` 또는 `npm start` 명령어로 앱을 실행합니다.
- **안드로이드 빌드:** `android/` 폴더의 Gradle 스크립트를 사용합니다.
- **API 연동:** 새로운 API는 `api/`에 추가하고, `api/index.js`에서 export합니다.
- **컨텍스트 사용:** 새로운 기능은 관련 컨텍스트 프로바이더로 감싸서 사용합니다.
- **컴포넌트 네이밍:** 파일명과 import는 항상 PascalCase(대문자 시작)를 사용합니다 (`WeatherInfo.js`).
- **테스트:** 공식 테스트 폴더는 없으나, 필요시 `__tests__/`에 추가합니다.

## 관례 및 패턴
- **파일명:** 대소문자 구분, import와 파일명은 반드시 일치시킵니다.
- **데이터 흐름:** API → Context → Screens/Components 순으로 데이터가 전달됩니다.
- **에러 처리:** 사용자에게 보여지는 에러는 `ErrorMessage.js`를 사용합니다.
- **로딩 상태:** `LoadingIndicator.js`를 사용합니다.
- **아이콘/에셋:** 모든 에셋은 `assets/`에 위치하며, 상대경로로 참조합니다.
- **날씨 아이콘:** `assets/weatherIcon/` 폴더를 사용하며, `index.js`로 import합니다.

## 통합 포인트
- **외부 API:** 모든 외부 연동은 `api/` 폴더에서 관리합니다 (대기질, 날씨, UV 등).
- **위치:** `LocationService.js`, `LocationContext.js`에서 위치 정보를 관리합니다.
- **테마:** `ThemeContext.js`, `styles/colors.js`에서 다크/라이트 모드를 관리합니다.

## 예시
- 새로운 날씨 API 추가:
  1. `api/newWeatherApi.js` 생성
  2. `api/index.js`에서 export
  3. 관련 화면/컴포넌트에서 사용
- 새로운 화면 추가:
  1. `screens/`에 파일 생성
  2. `BottomTabNavigator.js`에 네비게이션 추가

## 파일 트리
```
NicePlab/
├── App.js
├── app.json
├── babel.config.js
├── index.js
├── LICENSE
├── metro.config.js
├── package.json
├── README.md
│
├── android/
│
├── api/
│   ├── airQualityApi.js
│   ├── apiClient.js
│   ├── index.js
│   ├── pastTemperatureApi.js
│   ├── plabApi.js
│   ├── uvApi.js
│   ├── weatherForcastApi.js
│   └── weatherLiveApi.js
├── assets/
│
├── components/
│   ├── BottomTabNavigator.js
│   ├── ErrorMessage.js
│   ├── IcTshirt.js
│   ├── index.js
│   ├── LiveWeatherCard.js
│   ├── LoadingIndicator.js
│   ├── MatchDetails.js
│   ├── MatchFilter.js
│   ├── RecommendTimeCard.js
│   ├── Toast.js
│   └── WeatherInfo.js
├── configs/
│   └── exerciseScoreCriteria.js
├── constants/
│   ├── airKoreaRegion.js
│   ├── airKoreaStations.js
│   ├── dustLevelGrade.js
│   ├── gyeonggiRegions.js
│   ├── index.js
│   ├── kmaAreaCodes.json
│   ├── kmaAsosStations.js
│   ├── links.js
│   ├── plabLevelTiers.js
│   ├── plabRegion.js
│   └── seasonalTempThresholds.js
├── contexts/
│   ├── LocationContext.js
│   └── ThemeContext.js
├── hooks/
│   ├── index.js
│   ├── useDynamicGradient.js
│   └── useWeather.js
├── providers/
│   └── locationProvider.js
├── screens/
│   ├── CurrentLocationScreen.js
│   └── SearchScreen.js
├── services/
│   └── LocationService.js
├── styles/
│   ├── colors.js
│   ├── global.styles.js
│   ├── index.js
│   ├── liveWeatherCard.styles.js
│   ├── matchDetails.styles.js
│   ├── matchFilter.styles.js
│   ├── RecommendTimeCard.styles.js
│   ├── searchScreen.style.js
│   └── tabNavigator.styles.js
├── utils/
│   ├── exercise/
│   ├── formatters/
│   ├── getSeason.js
│   ├── index.js
│   ├── kmaApiUrlBuilder.js
│   ├── locationTransformer.js
│   ├── uvUtils.js
│   └── weatherDataHandler.js
```

---
불명확하거나 누락된 부분이 있으면 피드백을 남겨주세요. 추가 보완 가능합니다.