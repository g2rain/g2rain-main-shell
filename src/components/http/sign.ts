/**
 * DPoP 签名相关功能
 * 用于生成和验证 DPoP (Demonstrating Proof-of-Possession) 令牌
 */

import { sha256 } from 'js-sha256';
import { SignJWT, JWK } from 'jose';
import type { DpopHeader, DpopPayload, Client, HttpClient } from './types';
import { defaultParamsSerializer } from './params-serializer';

// 缓存 IAM keyId 和公钥
let cachedIamKeyId: string | null = null;
let cachedIamPublicKey: string | null = null;

/**
 * 从服务器获取 IAM keyId
 * - 通过传入的 HttpClient（通常为 getHttpClient('auth')）请求
 */
export async function fetchIamKeyId(httpClient: HttpClient<any>): Promise<string> {
  if (cachedIamKeyId) {
    return cachedIamKeyId;
  }

  try {
    const keyId = await httpClient.get<string>('/keys/iam-key-id');
    const text = (keyId as unknown as { data?: unknown }).data ?? keyId;
    cachedIamKeyId = typeof text === 'string' ? text.trim() : null;
    if (cachedIamKeyId == null) {
      throw new Error('Failed to fetch IAM key ID: empty response');
    }
    return cachedIamKeyId;
  } catch (error) {
    console.error('Failed to fetch IAM key ID:', error);
    throw error;
  }
}

/**
 * 从服务器获取 IAM 公钥
 * - 通过传入的 HttpClient（通常为 getHttpClient('auth')）请求
 */
export async function fetchIamPublicKey(httpClient: HttpClient<any>): Promise<string> {
  if (cachedIamPublicKey) {
    return cachedIamPublicKey;
  }

  try {
    const publicKey = await httpClient.get<string>('/keys/iam-public-key');
    const text = (publicKey as unknown as { data?: unknown }).data ?? publicKey;
    cachedIamPublicKey = typeof text === 'string' ? text.trim() : null;
    if (cachedIamPublicKey == null) {
      throw new Error('Failed to fetch IAM public key: empty response');
    }
    return cachedIamPublicKey;
  } catch (error) {
    console.error('Failed to fetch IAM public key:', error);
    throw error;
  }
}

/**
 * 生成 DPoP Header
 */
export const generateDpopHeader = function (publicKey: JWK, clientId: string): DpopHeader {
  const dpopHeader: DpopHeader = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    ph_alg: 'SHA-256',
    jwk: publicKey,
    kid: clientId,
  };
  return dpopHeader;
};

/**
 * DPoP 签名主函数
 * @param url - 请求 URL
 * @param method - HTTP 方法
 * @param params - 请求查询参数（原始格式，在此函数内部统一处理）
 * @param data - 请求体数据（原始格式，在此函数内部统一处理）
 * @param applicationCode - 应用代码
 * @param client - 客户端信息（Client 类型对象）
 * @param jti - JWT ID
 * @returns DPoP 令牌字符串
 */
export const dpopSign = async function (url: string, method: string, params: unknown, data: unknown, applicationCode: string, client: Client | null, jti: string): Promise<string> {
  if (client == null) throw new Error('client is required');

  // 1. 处理 params 参数（在此函数内部进行规范化处理，避免调用方修改原始格式）
  const processedParams = processParams(params);

  // 2. 处理 data 参数（此时 data 已经是最终发送给后端的字节流表示，如 Blob / ArrayBuffer / 字符串等）
  const processedData = await processData(data);

  // 3. 计算 pha (Payload Hash Algorithm)
  const pha = calculatePha(processedParams, processedData);

  // 4. 构建 dpopHeader
  const dpopHeader = generateDpopHeader(client.publicKey, client.clientId);

  // 5. 构建 DpopPayload
  const dpopPayload: DpopPayload = {
    htu: url,
    htm: method.toUpperCase(),
    acd: applicationCode,
    pha: pha,
    jti: jti,
  };

  // 6. 生成 JWT 令牌
  return await generateDpop(dpopHeader, dpopPayload, client.privateKey);
};

/**
 * 处理 params 参数
 * - 如果已经是字符串（例如通过 axios 的 paramsSerializer 预先序列化过），直接使用
 * - 其他情况统一通过 defaultParamsSerializer 进行规范化
 */
function processParams(params: unknown): string {
  if (typeof params === 'string') {
    return params;
  }
  return defaultParamsSerializer(params);
}

/**
 * 处理 data 参数
 *
 * - 对于 multipart/form-data：
 *   - 如果 data 已经是 Blob，将整个内容序列化为完整的 multipart/form-data 字节数组参与签名
 * - 对于其他类型：
 *   - 保持原有逻辑（字符串直接编码，对象 JSON 序列化后编码）
 * @param data - 请求体数据
 */
async function processData(data: unknown): Promise<ArrayBuffer> {
  // 空数据：返回空的 ArrayBuffer
  if (data == null) {
    return new ArrayBuffer(0);
  }

  // 如果 data 已经是 Blob（例如在 Axios 中预先序列化为 Blob 以发送），
  // 直接读取其字节流参与签名，确保与实际发送给后端的请求体完全一致。
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return await data.arrayBuffer();
  }

  // 已经是 ArrayBuffer
  if (data instanceof ArrayBuffer) {
    return data;
  }

  // TypedArray / DataView
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    const buffer = new ArrayBuffer(view.byteLength);
    new Uint8Array(buffer).set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    return buffer;
  }

  const encoder = new TextEncoder();

  // 字符串：直接编码
  if (typeof data === 'string') {
    return encoder.encode(data).buffer;
  }

  // 其他类型（对象等）：尝试 JSON 序列化后编码
  try {
    return encoder.encode(JSON.stringify(data)).buffer;
  } catch {
    // 无法序列化时返回空
    return new ArrayBuffer(0);
  }
}

/**
 * 计算PHA值 (Payload Hash Algorithm)
 */
function calculatePha(params: string, data: ArrayBuffer): string {
  const inputString = params + '\n' + sha256(data);
  return sha256(inputString);
}

/**
 * 生成Dpop签名
 */
export async function generateDpop(header: DpopHeader, payload: DpopPayload, privateKey: JWK): Promise<string> {
  try {
    return await new SignJWT(payload)
      .setProtectedHeader(header)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
  } catch (error) {
    console.error('generateDpop 异常:', error);
    // 降级到预生成密钥
    return '';
  }
}
