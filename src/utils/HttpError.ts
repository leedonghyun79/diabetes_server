/**
 * HTTP 상태 코드를 포함하는 커스텀 에러 클래스
 * Express 에러 핸들러에서 적절한 HTTP 응답을 반환하기 위해 사용
 */
export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';

    // TypeScript에서 Error를 상속할 때 필요
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
