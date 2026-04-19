/**
 * 微应用定义信息（Definition）
 * 可被多个 TabTypes / 实例复用
 */
export interface AppDefinition {
  appKey: string;      // 逻辑主键（平台级，对应 menuItem.key）
  name: string;        // runtime 注册名（qiankun / wujie），也用于标识实际的子应用
  entry: string;       // 应用入口
  activeRule: string;  // 激活规则（runtime 使用）
}