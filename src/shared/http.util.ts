/**
 * HTTP 相关工具函数
 * 提供与业务无关的通用 HTTP 处理能力
 */

import { FormDataEncoder } from 'form-data-encoder';

/**
 * 使用 form-data-encoder 将 FormData 编码为 multipart/form-data 字节流
 *
 * - 由 FormDataEncoder 生成 boundary 和 Content-Type
 * - 通过 Blob 负责拼接各个 chunk，避免手动计算 totalLength / offset 带来的越界风险
 * - 返回：
 *   - body: 完整的 multipart/form-data 字节流（用于发送和签名）
 *   - contentType: 含 boundary 的 Content-Type，需用于请求头，确保与 body 一致
 */
export async function buildMultipartFormDataBytes(
  formData: FormData,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const encoder = new FormDataEncoder(formData as any);

  // FormDataEncoder 实现了可迭代接口，迭代产生的 chunk 可能是 string 或 Uint8Array
  // 这里直接交给 Blob 负责拼接，避免自己算 totalLength / offset
  const blobParts: BlobPart[] = [];
  for (const chunk of encoder as any) {
    if (typeof chunk === 'string') {
      blobParts.push(chunk);
    } else {
      // Uint8Array / BufferSource
      blobParts.push(chunk);
    }
  }

  const blob = new Blob(blobParts);
  const body = await blob.arrayBuffer();

  const contentType = encoder.headers['Content-Type'] ?? 'multipart/form-data';

  return { body, contentType };
}
