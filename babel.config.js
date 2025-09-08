// babel.config.js

// module.exports는 Node.js 환경에서 사용되며, 이 파일의 설정을 외부로 내보내는 역할을 합니다.
module.exports = function(api) {
  // api.cache(true)는 Babel이 설정 파일을 매번 다시 읽지 않고 캐시된 버전을 사용하게 하여 성능을 향상시킵니다.
  api.cache(true);

  // return { ... } 부분이 실제 Babel 설정 내용입니다.
  return {
    // presets는 Babel이 코드를 어떻게 변환할지에 대한 규칙들의 모음입니다.
    // 'babel-preset-expo'는 Expo 프로젝트에 필요한 모든 Babel 규칙들(JSX, 최신 자바스크립트 문법 등)을
    // 한 번에 적용해주는 매우 편리한 설정입니다.
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin' ],
  };
};