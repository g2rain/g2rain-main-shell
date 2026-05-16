import axios, { type AxiosRequestConfig } from 'axios';
import { buildMultipartFormDataBytes } from '@shared/http.util';

/**
 * 请求体标准化处理：
 * - multipart/form-data：统一编码为字节流，设置带 boundary 的 Content-Type
 * - application/x-www-form-urlencoded：统一编码为字节流
 * - 其他类型：保持不变
 *
 * 该实现参考了现有 `src/runtime/http/axios.ts` 中的 prepareRequest 逻辑，
 * 抽取为可复用的纯函数，便于在新的 HttpClient 工厂中复用。
 */

export type BodyFormSerializer = (config: AxiosRequestConfig) => Promise<void>;

/**
 * 根据 Content-Type 对 AxiosRequestConfig.data 进行序列化：
 * - multipart/form-data                 -> 使用 formDataFormSerializer
 * - application/x-www-form-urlencoded   -> 使用 urlEncodedFormSerializer
 *
 * 必须 await，保证在 axios 拦截器（含 DPoP 签名）执行前 data / headers 已就绪。
 */
export async function applyFormSerializer(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
  const finalConfig: AxiosRequestConfig = { ...config };
  finalConfig.headers = {
    ...(typeof finalConfig.headers === 'object' && finalConfig.headers
      ? (finalConfig.headers as Record<string, unknown>)
      : {}),
  } as AxiosRequestConfig['headers'];

  const headers = (finalConfig.headers || {}) as Record<string, any>;
  const rawContentType =
    (headers['Content-Type'] as string | undefined) ??
    (headers['content-type'] as string | undefined);

  if (typeof rawContentType === 'string') {
    const contentType = rawContentType.toLowerCase();

    if (contentType.startsWith('multipart/form-data')) {
      await formDataFormSerializer(finalConfig);
    } else if (contentType.startsWith('application/x-www-form-urlencoded')) {
      await urlEncodedFormSerializer(finalConfig);
    }
  }

  return finalConfig;
}

/**
 * application/x-www-form-urlencoded 的 FormSerializer
 * - 使用 axios.toFormData 进行字段遍历
 * - 再转换为 URLSearchParams 字符串，供签名和适配器复用
 * - 就地修改 config.data / config.headers
 */
export async function urlEncodedFormSerializer(config: AxiosRequestConfig): Promise<void> {
  const headers = (config.headers || {}) as Record<string, any>;
  const rawContentType =
    (headers['Content-Type'] as string | undefined) ??
    (headers['content-type'] as string | undefined);

  if (
    typeof rawContentType !== 'string' ||
    !rawContentType.toLowerCase().startsWith('application/x-www-form-urlencoded')
  ) {
    return;
  }

  try {
    const data = config.data;

    if (typeof data === 'string' || data instanceof URLSearchParams) {
      return;
    }

    const formData = axios.toFormData(
      data as Record<string, any>,
      new FormData(),
    );

    const params = new URLSearchParams();
    (formData as FormData).forEach((value, key) => {
      params.append(key, typeof value === 'string' ? value : String(value));
    });

    const serialized = params.toString();

    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      config.headers = headers as AxiosRequestConfig['headers'];
    }

    config.data = serialized;
  } catch (error) {
    console.warn(
      '[HttpClient] 无法使用 formSerializer 编码 application/x-www-form-urlencoded，将退回到原始行为：',
      error,
    );
  }
}

/**
 * multipart/form-data 的 FormSerializer
 * - 始终使用统一编码器 buildMultipartFormDataBytes
 * - 就地修改 config.data（Blob）与 config.headers（Content-Type 含 boundary）
 */
export async function formDataFormSerializer(config: AxiosRequestConfig): Promise<void> {
  if (config.data == null) {
    return;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    try {
      const { body, contentType } = await buildMultipartFormDataBytes(config.data);

      const blob = new Blob([body]);

      config.data = blob;
      config.headers = config.headers || {};
      (config.headers as Record<string, any>)['Content-Type'] = contentType;
    } catch (error) {
      console.warn(
        '[HttpClient] 无法编码 FormData，将退回到原始 FormData 行为（可能导致签名与后端不一致）：',
        error,
      );
    }
  }
}
