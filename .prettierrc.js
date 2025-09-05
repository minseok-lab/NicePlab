// .prettierrc.js
module.exports = {
  // 화살표 함수에서 파라미터가 하나일 때 괄호를 생략하지 않도록 합니다. (예: (x) => x)
  arrowParens: 'avoid',
  // 괄호 안쪽에 공백을 넣지 않습니다. (예: { a: 1 })
  bracketSpacing: true,
  // JSX에서 여는 태그 옆에 닫는 태그(>)를 붙여줍니다.
  jsxBracketSameLine: false,
  // 문자열은 작은따옴표(')를 사용합니다.
  singleQuote: true,
  // 객체나 배열의 마지막 요소 뒤에 항상 쉼표를 붙입니다.
  trailingComma: 'all',
  // 줄 바꿈 방식을 LF로 강제합니다.
  endOfLine: 'lf',
};