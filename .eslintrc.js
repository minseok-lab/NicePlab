// .eslintrc.js
module.exports = {
  root: true,
  // extends를 배열로 만들고, prettier를 가장 마지막에 추가합니다.
  extends: ['@react-native-community', 'prettier'],
  // parser에게 어떤 문법을 기준으로 코드를 분석할지 알려주는 옵션입니다.
  parserOptions: {
    // ecmascript 버전, 'latest'로 설정하면 최신 버전을 사용합니다.
    ecmaVersion: 'latest', 
    // import/export 같은 ES 모듈 문법을 사용함을 의미합니다.
    sourceType: 'module', 
    // ecmascript의 추가적인 언어 기능을 설정합니다.
    ecmaFeatures: {
      // 이 부분이 핵심입니다! JSX 문법 사용을 허용합니다.
      jsx: true, 
    },
  },
  rules: {
    // JSX를 사용할 때 React를 import하지 않아도 되도록 규칙을 끕니다.
    'react/react-in-jsx-scope': 'off',
  },
};