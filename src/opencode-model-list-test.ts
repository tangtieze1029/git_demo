/**
 * OpenCode 模型列表集成测试
 *
 * 功能说明：
 *   通过 OpenCode SDK v2 接口查询当前可用的全部模型信息，
 *   支持按 directory / workspace 过滤，并以结构化格式打印每个模型的详细信息，
 *   包括：基本信息、API 配置、能力矩阵、费用、上下文限制、状态、变体等。
 *
 * 使用方式：
 *   1. 设置环境变量（可选）：
 *      - OPENCODE_BASE_URL   : OpenCode API 地址，默认 http://localhost:4096
 *      - OPENCODE_DIRECTORY  : 项目目录路径，用于过滤特定项目下的模型
 *      - OPENCODE_WORKSPACE  : 工作区路径，用于过滤特定工作区下的模型
 *   2. 运行：npx tsx apps/opencode-model-list-test.ts
 *
 * API 端点：GET /api/model
 * SDK 调用链：OpencodeClient -> .v2 -> .model -> .list()
 */

import {
  createOpencodeClient,
  type OpencodeClient,
} from '@opencode-ai/sdk/v2/client';

// ============================================================
// 配置接口定义
// ============================================================

/**
 * 模型列表测试的配置项
 *
 * @property baseUrl    - OpenCode API 的基础 URL（必填）
 * @property directory  - 项目目录路径（可选），用于查询特定项目下可用的模型
 * @property workspace  - 工作区路径（可选），用于查询特定工作区下可用的模型
 */
interface ModelListTestConfig {
  baseUrl: string;
  directory?: string;
  workspace?: string;
}

// ============================================================
// 类型定义（对应 SDK 返回的 ModelV2Info 结构）
// ============================================================

/**
 * 模型 API 配置 —— 描述模型底层使用的 SDK 类型
 *
 * 两种类型：
 *   - aisdk : 基于 AI SDK 包接入，有 npm 包名
 *   - native: 原生接入，有自定义 settings
 */
type ModelApiInfo =
  | { id: string; type: 'aisdk'; package: string; url?: string; settings?: Record<string, unknown> }
  | { id: string; type: 'native'; url?: string; settings: Record<string, unknown> };

/**
 * 模型能力描述
 *
 * @property tools  - 是否支持工具调用（function calling）
 * @property input  - 支持的输入类型列表，如 ["text", "image"]
 * @property output - 支持的输出类型列表，如 ["text"]
 */
interface ModelCapabilities {
  tools: boolean;
  input: string[];
  output: string[];
}

/**
 * 模型费用信息（单个计费层级）
 *
 * @property tier  - 计费层级条件（如按上下文大小分档）
 * @property input - 输入 token 单价（美元 / 百万 token）
 * @property output- 输出 token 单价
 * @property cache - 缓存读写单价
 */
interface ModelCostInfo {
  tier?: { type: string; size: number };
  input: number;
  output: number;
  cache: { read: number; write: number };
}

/**
 * 模型生成参数配置
 *
 * 描述该模型支持的推理参数及其默认/限制值
 */
interface ModelGenerationConfig {
  maxTokens?: number | string;
  temperature?: number | string;
  topP?: number | string;
  topK?: number | string;
  frequencyPenalty?: number | string;
  presencePenalty?: number | string;
  seed?: number | string;
  stop?: string[];
}

/**
 * 模型变体信息
 *
 * 变体是同一模型的不同配置版本（如不同参数预设）
 */
interface ModelVariant {
  id: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  generation?: ModelGenerationConfig;
  options?: Record<string, unknown>;
}

/**
 * 单个模型的完整信息结构（对应 SDK 的 ModelV2Info）
 */
interface ModelInfo {
  /** 模型唯一标识 */
  id: string;
  /** 所属 Provider 标识，如 "anthropic", "openai" */
  providerID: string;
  /** 模型系列/家族，如 "claude", "gpt" */
  family?: string;
  /** 模型显示名称 */
  name: string;
  /** API 接入方式配置 */
  api: ModelApiInfo;
  /** 模型能力矩阵 */
  capabilities: ModelCapabilities;
  /** 请求配置（headers / body / 生成参数） */
  request: {
    headers: Record<string, string>;
    body: Record<string, unknown>;
    generation?: ModelGenerationConfig;
    options?: Record<string, unknown>;
    variant?: string;
  };
  /** 可用变体列表 */
  variants: ModelVariant[];
  /** 时间信息 */
  time: { released: number | string };
  /** 费用信息（可能有多层计费） */
  cost: ModelCostInfo[];
  /** 模型状态：alpha(内测) / beta(公测) / active(正式) / deprecated(已废弃) */
  status: 'alpha' | 'beta' | 'deprecated' | 'active';
  /** 是否已启用 */
  enabled: boolean;
  /** 上下文窗口限制 */
  limit: { context: number; input?: number; output: number };
}

/**
 * API 响应中的位置信息（描述查询的上下文范围）
 */
interface LocationInfo {
  directory: string;
  workspaceID?: string;
  project: { id: string; directory: string };
}

// ============================================================
// 核心测试类
// ============================================================

/**
 * OpenCode 模型列表测试类
 *
 * 封装了模型查询与结果展示的完整流程：
 *   1. 初始化 SDK 客户端
 *   2. 调用 v2.model.list() 查询模型列表
 *   3. 按 Provider 分组统计
 *   4. 逐个打印模型详细信息
 *   5. 输出汇总统计
 */
class OpenCodeModelListTest {
  /** SDK 客户端实例，用于调用 OpenCode API */
  private readonly client: OpencodeClient;

  constructor(private readonly config: ModelListTestConfig) {
    // 创建 SDK 客户端，responseStyle: 'fields' 表示返回结构化字段而非原始 Response
    this.client = createOpencodeClient({
      baseUrl: config.baseUrl,
      responseStyle: 'fields',
    });
  }

  /**
   * 执行测试主流程
   *
   * 步骤：
   *   1. 打印当前配置
   *   2. 调用 API 获取模型列表
   *   3. 打印模型详情
   *   4. 打印统计汇总
   */
  async run(): Promise<void> {
    // ---- 步骤 1：打印配置信息 ----
    console.log('[INFO] OpenCode 模型列表查询测试');
    console.log(`  Base URL  : ${this.config.baseUrl}`);
    console.log(`  Directory : ${this.config.directory ?? '(未指定，使用默认)'}`);
    console.log(`  Workspace : ${this.config.workspace ?? '(未指定)'}`);
    console.log();

    // ---- 步骤 2：调用 API ----
    const { location, models } = await this.fetchModels();

    // ---- 步骤 3：打印位置信息 ----
    this.printLocation(location);

    // ---- 步骤 4：打印每个模型的详细信息 ----
    this.printModels(models);

    // ---- 步骤 5：打印统计汇总 ----
    this.printSummary(models);
  }

  /**
   * 调用 OpenCode API 获取模型列表
   *
   * 根据配置中的 directory / workspace 构建查询参数，
   * 调用 SDK 的 v2.model.list() 方法发送 GET /api/model 请求。
   *
   * @returns 位置信息和模型列表
   * @throws 当 API 返回错误或数据为空时抛出异常
   */
  private async fetchModels(): Promise<{ location: LocationInfo; models: ModelInfo[] }> {
    console.log('[INFO] 正在查询可用模型列表...');

    // 构建查询参数：仅在配置了 directory 或 workspace 时传入 location
    const params: { location?: { directory?: string; workspace?: string } } = {};
    if (this.config.directory || this.config.workspace) {
      params.location = {};
      if (this.config.directory) params.location.directory = this.config.directory;
      if (this.config.workspace) params.location.workspace = this.config.workspace;
    }

    // 调用 SDK：client.v2.model.list() -> GET /api/model
    // 参数类型使用 as never 断言以适配 SDK 的泛型签名
    const result = await this.client.v2.model.list(params as never);

    // 错误处理：检查 API 是否返回错误
    if (result.error || !result.data) {
      const message = result.error instanceof Error
        ? result.error.message
        : JSON.stringify(result.error);
      throw new Error(`查询模型列表失败: ${message}`);
    }

    // 从响应中提取位置信息和模型数据
    const response = result.data as unknown as { location: LocationInfo; data: ModelInfo[] };
    const models = response.data ?? [];

    console.log(`[SUCCESS] 共查询到 ${models.length} 个模型\n`);

    return { location: response.location, models };
  }

  /**
   * 打印 API 返回的位置信息（查询上下文范围）
   */
  private printLocation(location: LocationInfo): void {
    console.log('[Location Info]');
    console.log(`  Directory   : ${location.directory}`);
    if (location.workspaceID) {
      console.log(`  Workspace ID: ${location.workspaceID}`);
    }
    console.log(`  Project ID  : ${location.project.id}`);
    console.log(`  Project Dir : ${location.project.directory}`);
    console.log();
  }

  /**
   * 逐个打印模型的详细信息
   *
   * 每个模型展示以下信息块：
   *   - 基本信息（ID、名称、Provider、系列、状态、是否启用）
   *   - API 配置（接入类型、包名/URL）
   *   - 能力矩阵（工具调用、输入/输出类型）
   *   - 上下文限制（context / input / output）
   *   - 费用信息（按层级展示）
   *   - 生成参数（temperature、maxTokens 等）
   *   - 变体列表
   */
  private printModels(models: ModelInfo[]): void {
    if (models.length === 0) {
      console.log('[INFO] 未查询到任何可用模型');
      return;
    }

    models.forEach((model, index) => {
      // 分隔线 + 序号
      console.log(`${'─'.repeat(60)}`);
      console.log(`模型 [${index + 1}/${models.length}]`);

      // ---- 基本信息 ----
      console.log(`  名称      : ${model.name}`);
      console.log(`  ID        : ${model.id}`);
      console.log(`  Provider  : ${model.providerID}`);
      console.log(`  系列      : ${model.family ?? '(未知)'}`);
      console.log(`  状态      : ${this.formatStatus(model.status)}`);
      console.log(`  已启用    : ${model.enabled ? '是' : '否'}`);

      // ---- API 接入方式 ----
      console.log(`  API 类型  : ${model.api.type}`);
      if (model.api.type === 'aisdk') {
        console.log(`  SDK 包名  : ${model.api.package}`);
        if (model.api.url) console.log(`  API URL   : ${model.api.url}`);
      } else {
        if (model.api.url) console.log(`  API URL   : ${model.api.url}`);
      }

      // ---- 能力矩阵 ----
      console.log(`  能力:`);
      console.log(`    工具调用  : ${model.capabilities.tools ? '支持' : '不支持'}`);
      console.log(`    输入类型  : ${model.capabilities.input.join(', ') || '(无)'}`);
      console.log(`    输出类型  : ${model.capabilities.output.join(', ') || '(无)'}`);

      // ---- 上下文窗口限制 ----
      console.log(`  上下文限制:`);
      console.log(`    Context   : ${this.formatNumber(model.limit.context)} tokens`);
      if (model.limit.input !== undefined) {
        console.log(`    Input     : ${this.formatNumber(model.limit.input)} tokens`);
      }
      console.log(`    Output    : ${this.formatNumber(model.limit.output)} tokens`);

      // ---- 费用信息 ----
      if (model.cost.length > 0) {
        console.log(`  费用 (USD / 百万 tokens):`);
        model.cost.forEach((tier, i) => {
          const tierLabel = tier.tier
            ? `[层级 ${i + 1}: ${tier.tier.type} >= ${this.formatNumber(tier.tier.size)}]`
            : `[默认层级]`;
          console.log(`    ${tierLabel}`);
          console.log(`      Input : $${tier.input.toFixed(2)}  |  Output: $${tier.output.toFixed(2)}`);
          console.log(`      Cache Read: $${tier.cache.read.toFixed(2)}  |  Cache Write: $${tier.cache.write.toFixed(2)}`);
        });
      } else {
        console.log(`  费用      : (免费或未配置)`);
      }

      // ---- 生成参数配置 ----
      if (model.request.generation) {
        const gen = model.request.generation;
        console.log(`  生成参数:`);
        if (gen.temperature !== undefined) console.log(`    Temperature     : ${gen.temperature}`);
        if (gen.maxTokens !== undefined) console.log(`    Max Tokens      : ${gen.maxTokens}`);
        if (gen.topP !== undefined) console.log(`    Top P           : ${gen.topP}`);
        if (gen.topK !== undefined) console.log(`    Top K           : ${gen.topK}`);
        if (gen.frequencyPenalty !== undefined) console.log(`    Frequency Penalty: ${gen.frequencyPenalty}`);
        if (gen.presencePenalty !== undefined) console.log(`    Presence Penalty : ${gen.presencePenalty}`);
        if (gen.seed !== undefined) console.log(`    Seed            : ${gen.seed}`);
        if (gen.stop && gen.stop.length > 0) console.log(`    Stop Sequences  : ${gen.stop.join(', ')}`);
      }

      // ---- 变体列表 ----
      if (model.variants.length > 0) {
        console.log(`  变体 (${model.variants.length} 个):`);
        model.variants.forEach((variant) => {
          console.log(`    - ${variant.id}`);
        });
      }

      // ---- 发布时间 ----
      if (model.time.released !== undefined && !Number.isNaN(Number(model.time.released))) {
        const date = new Date(Number(model.time.released) * 1000);
        console.log(`  发布时间  : ${date.toISOString().split('T')[0]}`);
      }

      console.log();
    });

    console.log('─'.repeat(60));
    console.log();
  }

  /**
   * 打印模型统计汇总信息
   *
   * 统计维度：
   *   - 总数 / 启用数 / 未启用数
   *   - 按状态分组计数（active / beta / alpha / deprecated）
   *   - 按 Provider 分组计数
   *   - 支持工具调用的模型数量
   */
  private printSummary(models: ModelInfo[]): void {
    console.log('[统计汇总]');
    console.log(`  总模型数  : ${models.length}`);

    // 按启用状态统计
    const enabledCount = models.filter((m) => m.enabled).length;
    console.log(`  已启用    : ${enabledCount}`);
    console.log(`  未启用    : ${models.length - enabledCount}`);

    // 按模型状态（status）分组统计
    const statusMap = new Map<string, number>();
    models.forEach((m) => {
      statusMap.set(m.status, (statusMap.get(m.status) ?? 0) + 1);
    });
    console.log(`  按状态:`);
    for (const [status, count] of [...statusMap.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${this.formatStatus(status)}: ${count}`);
    }

    // 按 Provider 分组统计
    const providerMap = new Map<string, number>();
    models.forEach((m) => {
      providerMap.set(m.providerID, (providerMap.get(m.providerID) ?? 0) + 1);
    });
    console.log(`  按 Provider:`);
    for (const [provider, count] of [...providerMap.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${provider}: ${count}`);
    }

    // 支持工具调用的模型数
    const toolCapable = models.filter((m) => m.capabilities.tools).length;
    console.log(`  支持工具调用: ${toolCapable} / ${models.length}`);

    console.log();
  }

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * 格式化模型状态为可读的中文字符串
   */
  private formatStatus(status: string): string {
    const statusLabels: Record<string, string> = {
      active: '正式 (active)',
      beta: '公测 (beta)',
      alpha: '内测 (alpha)',
      deprecated: '已废弃 (deprecated)',
    };
    return statusLabels[status] ?? status;
  }

  /**
   * 格式化大数字，添加千分位分隔符以提高可读性
   * 例如：200000 -> "200,000"
   */
  private formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }
}

// ============================================================
// 入口函数
// ============================================================

/**
 * 程序入口
 *
 * 从环境变量读取配置，创建测试实例并执行。
 * 支持的环境变量：
 *   - OPENCODE_BASE_URL  : API 地址（默认 http://localhost:4096）
 *   - OPENCODE_DIRECTORY : 项目目录（可选）
 *   - OPENCODE_WORKSPACE : 工作区路径（可选）
 */
async function main(): Promise<void> {
  // 构建配置对象：baseUrl 必填，其余按需从环境变量读取
  const config: ModelListTestConfig = {
    baseUrl: process.env.OPENCODE_BASE_URL ?? 'http://localhost:4096',
  };
  if (process.env.OPENCODE_DIRECTORY) config.directory = process.env.OPENCODE_DIRECTORY;
  if (process.env.OPENCODE_WORKSPACE) config.workspace = process.env.OPENCODE_WORKSPACE;

  // 创建测试实例并运行
  const test = new OpenCodeModelListTest(config);
  await test.run();
}

// 执行入口，捕获顶层异常
main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
