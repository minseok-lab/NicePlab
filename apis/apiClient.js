// api/apiClient.js

/**
 * @typedef {object} ApiClientOptions
 * @property {string} [method='GET'] - HTTPs 요청 메서드 ('GET', 'POST', 'PUT', 'DELETE' 등)
 * @property {object} [headers] - HTTP 요청 헤더
 * @property {any} [body] - HTTP 요청 바디 (보통 JSON.stringify된 데이터)
 * @property {string} [apiName='API'] - 로깅 시 어떤 API인지 식별하기 위한 이름
 */

/**
 * 재사용 가능한 범용 API 클라이언트입니다.
 * 모든 종류의 fetch 요청, JSON 파싱, 중앙화된 에러 핸들링을 담당합니다.
 * @param {string} url - 요청을 보낼 URL
 * @param {ApiClientOptions} [options={}] - fetch API의 옵션 객체
 * @returns {Promise<object|null>} 성공 시 파싱된 JSON 데이터, 실패 시 null을 반환합니다.
 */
export const apiClient = async (url, options = {}) => {
  // 옵션의 기본값을 설정하고, apiName은 로깅을 위해 별도로 분리합니다.
  const { method = 'GET', headers, body, apiName = 'API' } = options;
  let responseText = ''; // 에러 발생 시 로깅을 위해 원본 응답 텍스트를 저장합니다

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json', // JSON 통신을 기본으로 가정
        ...headers, // 사용자가 제공한 헤더가 있다면 덮어씁니다.
      },
      // GET, HEAD 메서드는 body를 가질 수 없으므로 해당 경우엔 undefined로 설정합니다.
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
    });

    responseText = await response.text();

    // HTTP 상태 코드가 2xx가 아닐 경우 에러로 처리합니다.
    if (!response.ok) {
      console.error(
        `[${apiName}] ❗ HTTP 에러! Status: ${response.status}, 응답: ${responseText}`,
      );
      return null;
    }

    // 응답 본문이 비어있는 경우 (예: 204 No Content)
    // 성공적인 빈 응답으로 처리하고 null 대신 빈 객체를 반환할 수도 있습니다.
    if (!responseText) {
      console.log(
        `[${apiName}] ✅ 요청은 성공했으나 응답 본문이 비어있습니다.`,
      );
      return {}; // 비어있는 것도 성공 응답의 한 종류이므로 null 대신 빈 객체를 반환
    }

    // 텍스트를 JSON으로 파싱합니다.
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    // 네트워크 에러 또는 JSON 파싱 에러를 처리합니다.
    if (error instanceof SyntaxError) {
      // JSON 파싱 에러일 경우, 원본 텍스트를 함께 로깅하여 디버깅을 돕습니다.
      console.error(
        `[${apiName}] ❗ JSON 파싱 실패. 응답: ${responseText}`,
        error,
      );
    } else {
      // 그 외 네트워크 등의 에러
      console.error(`[${apiName}] ❗ 요청 실패: ${error.message}`, error);
    }
    return null;
  }
};
