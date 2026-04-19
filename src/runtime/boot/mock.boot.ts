/**
 * Mock 数据启动器
 * 用于在应用启动时注册所有 mock 数据到 mockManager
 */

import { mockManager } from '@/components/http/mock-data';
import { env } from '@shared/env';
import { authMockDataMap } from '@runtime/mock-data/auth.data';
import { testMockDataMap } from '@runtime/mock-data/test.api';
import { commonMockDataMap } from '@runtime/mock-data/data';

class MockBoot {
  private registered: boolean = false;

  /**
   * 启动 Mock 数据注册
   * 仅在开发环境且启用 mock 时注册
   */
  start(): void {
    // 仅在开发环境且启用 mock 时注册
    if (!env.VITE_MOCK_ENABLED) {
      console.log('[MockBoot] Mock 未启用，跳过注册');
      return;
    }

    // 如果已经注册过，跳过
    if (this.registered) {
      console.log('[MockBoot] Mock 数据已注册，跳过');
      return;
    }

    // 注册所有业务 mock 数据
    mockManager.registerAll(commonMockDataMap);
    mockManager.registerAll(authMockDataMap);
    mockManager.registerAll(testMockDataMap);

    this.registered = true;
    console.log('[MockBoot] ✅ Mock 数据已注册');
  }

  /**
   * 停止 Mock 数据（清除所有已注册的 mock 数据）
   */
  stop(): void {
    if (this.registered) {
      mockManager.clear();
      this.registered = false;
      console.log('[MockBoot] ✅ Mock 数据已清除');
    }
  }

  /**
   * 重置启动器状态
   */
  reset(): void {
    this.stop();
  }
}

export const mockBoot = new MockBoot();
