// components/index.js

// 1. 각 컴포넌트를 default로 가져옵니다.
import WeatherInfo from './WeatherInfo';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';
import Toast from './Toast';
import WeatherCard from './WeatherCard';
import MatchDetails from './MatchDetails';

// 2. 가져온 컴포넌트들을 named export 방식으로 내보냅니다.
export {
  WeatherInfo,
  LoadingIndicator,
  ErrorMessage,
  Toast,
  WeatherCard,
  MatchDetails,
};