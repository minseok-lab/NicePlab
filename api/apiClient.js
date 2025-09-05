// api/apiClient.js

/**
 * 재사용 가능한 API 클라이언트입니다.
 * fetch 요청, JSON 파싱, 중앙화된 에러 핸들링을 담당합니다.
 * @param {string} url - 요청을 보낼 URL
 * @param {string} apiName - 로깅 시 어떤 API인지 식별하기 위한 이름
 * @returns {Promise<object|null>} 성공 시 파싱된 JSON 데이터, 실패 시 null을 반환합니다.
 */
export const apiClient = async (url, apiName = 'API') => {
  let responseText = ''; // 에러 발생 시 로깅을 위해 원본 응답 텍스트를 저장합니다.

  try {
    const response = await fetch(url);
    responseText = await response.text();

    // HTTP 상태 코드가 2xx가 아닐 경우 에러로 처리합니다.
    if (!response.ok) {
      console.error(
        `[${apiName}] ❗ HTTP 에러! Status: ${response.status}, 응답: ${responseText}`,
      );
      return null;
    }

    // 응답 본문이 비어있는 경우
    if (!responseText) {
      console.warn(`[${apiName}] ❗ API 응답이 비어있습니다.`);
      return null;
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
      console.error(`[${apiName}] ❗ 요청 실패.`, error);
    }
    return null;
  }
};
