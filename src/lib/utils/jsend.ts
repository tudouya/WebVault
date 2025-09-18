// JSend helpers and types

export type JSendStatus = 'success' | 'fail' | 'error';

export interface JSendSuccess<T> {
  status: 'success';
  data: T;
}

export interface JSendFail {
  status: 'fail';
  data: unknown;
}

export interface JSendError {
  status: 'error';
  message: string;
  code?: string | number;
  data?: unknown;
}

export type JSendResponse<T> = JSendSuccess<T> | JSendFail | JSendError;

export function jsendSuccess<T>(data: T): JSendSuccess<T> {
  return { status: 'success', data };
}

export function jsendFail(data: unknown): JSendFail {
  return { status: 'fail', data };
}

export function jsendError(message: string, code?: string | number, data?: unknown): JSendError {
  return { status: 'error', message, ...(code !== undefined ? { code } : {}), ...(data !== undefined ? { data } : {}) };
}

export async function parseJSendFetch<T>(res: Response): Promise<JSendResponse<T>> {
  const contentType = res.headers.get('content-type') || '';
  const isJSON = contentType.includes('application/json');
  if (!isJSON) {
    if (!res.ok) {
      return jsendError(`HTTP ${res.status}`);
    }
    // Non-JSON success is unusual; return a fail with raw text
    const text = await res.text();
    return jsendFail({ raw: text });
  }
  return (await res.json()) as JSendResponse<T>;
}

