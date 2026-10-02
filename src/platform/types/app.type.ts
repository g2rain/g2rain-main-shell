/**
 * 微应用定义信息（Definition）
 * 可被多个 TabTypes / 实例复用
 */
export type AppIntegrationMode = 'appkit' | 'legacy';

export interface AppDefinition {
  appKey: string;      // 逻辑主键（平台级，对应 menuItem.key）
  applicationCode: string; // 稳定应用编码（对应后端 AuthorityMenuVo.applicationCode）
  mode: AppIntegrationMode; // Shell 接入契约：AppKit 新模式或传统兼容模式
  name: string;        // runtime 注册名（qiankun / wujie），也用于标识实际的子应用
  entry: string;       // 应用入口
  activeRule: string;  // 激活规则（runtime 使用）
}
