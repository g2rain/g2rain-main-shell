import { exportJWK, generateKeyPair, JWK, importSPKI } from 'jose';
import { Generator } from '@shared/utils/generator';
import type { DpopClient } from '@g2rain/http';

// 生成密钥对 - 支持降级方案
export async function generateKey() {
  try {
    const { privateKey, publicKey } = await generateKeyPair('ES256', {
      extractable: true,
    });

    const publicKeyJwk = await cryptoKeyToJwk(publicKey);
    const privateKeyJwk = await cryptoKeyToJwk(privateKey);

    return {
      publicKey: publicKeyJwk,
      privateKey: privateKeyJwk,
    };
  } catch (error) {
    console.error('Web Crypto API 密钥生成失败，使用降级方案:', error);
    throw error;
  }
}

async function cryptoKeyToJwk(key: CryptoKey): Promise<JWK> {
  return await exportJWK(key);
}

export async function publicKeyStringToJwk(publicKey: string): Promise<JWK> {
  const key = await importSPKI(publicKey, 'ES256');
  return await exportJWK(key);
}

export async function generateClient(): Promise<DpopClient> {
  try {
    const { publicKey, privateKey } = await generateKey();

    return {
      clientId: Generator.random(),
      privateKey,
      publicKey,
      isAuthenticated: false,
    };
  } catch (error) {
    console.error('密钥对生成和导出失败:', error);
    throw error;
  }
}
