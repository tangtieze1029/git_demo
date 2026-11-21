/**
 * ============================================================================
 * TypeScript 错误处理全演示：从 try/catch 到类型安全的错误体系
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-error-handling-demo.ts
 *
 * 类型校验：
 *   npx tsc --noEmit
 *
 * 覆盖清单：
 *   1.  try / catch / finally 基础与执行顺序
 *   2.  catch 变量在 strict 下是 unknown：必须先收窄
 *   3.  throw 规则：抛 Error 子类，抛错后控制流为 never
 *   4.  自定义错误体系：基类 + 子类 + code + cause 链
 *   5.  按类型分派处理：instanceof 与 switch(code) + 穷尽检查
 *   6.  错误归一化：toError 与类型守卫 isAppError
 *   7.  Result 风格：把错误当数据，不抛异常
 *   8.  异步错误：try/catch、catch 回调、Promise.all vs allSettled
 *   9.  重试 + 指数退避 + 超时控制
 *   10. 资源清理：finally 保证释放
 *   11. 常见坑位汇总
 * ============================================================================
 */

// ============================================================================
// 0. 公共工具
// ============================================================================

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// 4. 自定义错误体系
//    - 继承 Error 才能拿到 stack，且 instanceof 才能正常工作
//    - name 设为具体类名，日志里一眼可辨
//    - code 用字面量联合类型，编译期可穷尽检查
//    - cause 保留底层原始错误，避免信息丢失
// ============================================================================

/** 应用级错误码：联合类型，使 switch 分支可被编译器穷尽校验 */
type ErrorCode = 'NETWORK' | 'TIMEOUT' | 'VALIDATION' | 'NOT_FOUND';

/** 所有业务错误的基类 */
class AppError extends Error {
  readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode, options?: ErrorOptions) {
    super(message, options);
    // new.target 保证子类实例的 name 是子类名，而不是 'Error'
    this.name = new.target.name;
    this.code = code;
  }
}

class NetworkError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'NETWORK', options);
  }
}

class TimeoutError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'TIMEOUT', options);
  }
}

class ValidationError extends AppError {
  /** 字段级错误明细：结构化信息比一条 message 更有用 */
  readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>, options?: ErrorOptions) {
    super(message, 'VALIDATION', options);
    this.fields = fields;
  }
}

class NotFoundError extends AppError {
  readonly resource: string;

  constructor(resource: string, options?: ErrorOptions) {
    super(`${resource} 不存在`, 'NOT_FOUND', options);
    this.resource = resource;
  }
}

// ============================================================================
// 6. 错误归一化与类型守卫
//    - catch 到的东西可能是任何值（string / number / undefined / 别人的库）
//    - 一律先归一化成 Error，再进入业务处理
// ============================================================================

/** 归一化：把任意抛出值转成 Error 实例 */
function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return new Error(String((value as { message: unknown }).message));
  }
  return new Error(`非 Error 抛出值：${String(value)}`);
}

/** 类型守卫：判断是否是自家的 AppError，同时把类型收窄 */
function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

// ============================================================================
// 7. Result 风格
//    - 「预期内的失败」用返回值表达，调用方无法忘记处理
//    - 「预期外的崩溃」才抛异常，两者不要混着用
// ============================================================================

type Result<T, E = AppError> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** 模拟「可能失败但不该抛」的解析：失败返回 Result */
function parsePort(input: string): Result<number, ValidationError> {
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return err(new ValidationError('端口不合法', { port: `期望 1-65535 的整数，实际收到 "${input}"` }));
  }
  return ok(parsed);
}

// ============================================================================
// 9. 重试 / 超时
// ============================================================================

interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  /** 只对「可恢复」错误重试，例如网络错误；参数错误重试再多次也没用 */
  shouldRetry?: (error: unknown) => boolean;
}

async function retry<T>(task: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { retries, baseDelayMs, shouldRetry = () => true } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await task();
    } catch (error: unknown) {
      lastError = error;
      const canRetry = attempt < retries && shouldRetry(error);
      console.log(`   第 ${attempt + 1} 次失败：${toError(error).message}${canRetry ? '，准备重试' : '，不再重试'}`);
      if (!canRetry) break;
      // 指数退避：100ms、200ms、400ms ...
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw toError(lastError);
}

function withTimeout<T>(task: Promise<T>, ms: number, label: string): Promise<T> {
  const timer = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError(`${label} 超时（${ms}ms）`)), ms);
  });
  // Promise.race 让「任务」和「定时器」赛跑，谁先结束用谁
  return Promise.race([task, timer]);
}

/** 模拟不稳定的外部调用：前 failTimes 次抛网络错误，之后成功 */
function createFlakyApi(failTimes: number): () => Promise<string> {
  let calls = 0;
  return async () => {
    calls += 1;
    await sleep(10);
    if (calls <= failTimes) {
      throw new NetworkError(`连接被重置（第 ${calls} 次调用）`, { cause: new Error('ECONNRESET') });
    }
    return `第 ${calls} 次调用成功`;
  };
}

// ============================================================================
// 5. 统一错误出口：按类型/错误码分派，穷尽检查防止漏分支
// ============================================================================

function assertNever(value: never): never {
  // 只要某个 code 没被处理，这里就会编译报错（never 不可赋值）
  throw new Error(`未处理的错误码：${String(value)}`);
}

function handleError(error: unknown): string {
  const normalized = toError(error);

  if (!isAppError(normalized)) {
    // 非自家错误：属于「未知异常」，记录完整堆栈，对外给泛化文案
    return `未知异常（${normalized.name}）：${normalized.message}`;
  }

  switch (normalized.code) {
    case 'NETWORK':
      // 可利用 cause 追到根因
      return `网络错误：${normalized.message}（根因：${toError(normalized.cause).message}）`;
    case 'TIMEOUT':
      return `超时错误：${normalized.message}`;
    case 'VALIDATION': {
      // code 只能收窄到基类；子类独有字段需要 instanceof 再收窄一次
      const fields = normalized instanceof ValidationError ? normalized.fields : {};
      return `参数错误：${normalized.message} ${JSON.stringify(fields)}`;
    }
    case 'NOT_FOUND': {
      const resource = normalized instanceof NotFoundError ? normalized.resource : '未知资源';
      return `资源缺失：${resource}`;
    }
    default:
      // 新增 ErrorCode 却漏写分支时，这里会编译报错
      return assertNever(normalized.code);
  }
}

// ============================================================================
// 各演示步骤
// ============================================================================

/** 1. try / catch / finally */
function demoBasic(): void {
  console.log('   try → throw → catch → finally 的执行顺序：');
  try {
    console.log('     try 开始');
    throw new Error('出错了');
  } catch (error: unknown) {
    console.log('     catch 捕获：', toError(error).message);
    // catch 内再抛 / return，finally 依然会执行
  } finally {
    console.log('     finally 一定执行（无论成功、失败还是提前 return）');
  }

  // 不写 catch 只写 finally 也合法：用于「必须清理但不处理错误」
  try {
    console.log('     仅 finally 的例子');
  } finally {
    console.log('     finally 执行后，错误继续向外抛');
  }
}

/** 2. catch 变量是 unknown */
function demoUnknownCatch(): void {
  const badInputs: unknown[] = [new Error('标准错误'), '字符串错误', { message: '类错误对象' }, 42];

  for (const input of badInputs) {
    try {
      throw input;
    } catch (error: unknown) {
      // 直接 error.message 会编译报错：unknown 上不存在 message
      console.log('     归一化结果：', toError(error).message);
    }
  }
}

/** 3. throw 与 never */
function alwaysThrow(): never {
  // never 意味着函数永不正常返回，调用处后续代码不可达
  throw new AppError('不可恢复的错误', 'NETWORK');
}

function demoThrow(): void {
  try {
    console.log('     调用永不返回的函数前');
    alwaysThrow();
    // 下面这行在类型层面不可达，但运行时也不会执行
    console.log('     这行永远不会打印');
  } catch (error: unknown) {
    console.log('     捕获：', toError(error).message);
  }

  console.log('     建议：只抛 Error 子类，不要抛字符串/数字，否则会丢失 stack');
}

/** 4. 自定义错误体系 */
function demoCustomErrors(): void {
  const errors: AppError[] = [
    new NetworkError('请求超时', { cause: new Error('ETIMEDOUT') }),
    new TimeoutError('上游 3s 未响应'),
    new ValidationError('提交数据不合法', { name: '不能为空', age: '必须是正整数' }),
    new NotFoundError('用户 #42'),
  ];

  for (const error of errors) {
    console.log(`     ${error.name} | code=${error.code} | instanceof Error=${error instanceof Error}`);
    console.log(`       message: ${error.message}`);
    if (error.cause !== undefined) {
      console.log(`       根因: ${toError(error.cause).message}`);
    }
  }

  // 捕获后可用于精细化分支：instanceof 判断具体子类
  const validation = new ValidationError('失败', { email: '格式错误' });
  if (validation instanceof ValidationError) {
    console.log('     instanceof 可访问子类独有字段：', validation.fields);
  }
}

/** 5. 分派处理 */
function demoDispatch(): void {
  const cases: unknown[] = [
    new NetworkError('DNS 解析失败', { cause: new Error('ENOTFOUND') }),
    new TimeoutError('等待数据库响应超时'),
    new ValidationError('字段校验失败', { phone: '格式不正确' }),
    new NotFoundError('订单 #A1001'),
    new Error('第三方库抛出的裸错误'),
    '别人抛的字符串',
  ];

  for (const item of cases) {
    console.log('     →', handleError(item));
  }
}

/** 6. 归一化 */
function demoNormalize(): void {
  const values: unknown[] = [new TypeError('类型错误'), '纯字符串', { message: '对象消息' }, undefined];
  for (const value of values) {
    const normalized = toError(value);
    console.log(`     原始类型=${typeof value} → ${normalized.name}: ${normalized.message}`);
  }
}

/** 7. Result 风格 */
function demoResult(): void {
  const inputs = ['8080', '0', 'abc', '70000'];
  for (const input of inputs) {
    const result = parsePort(input);
    if (result.ok) {
      // 收窄后才有 value
      console.log(`     "${input}" → 端口 ${result.value}`);
    } else {
      // 收窄后才有 error
      console.log(`     "${input}" → 失败 ${result.error.code}：${result.error.fields['port'] ?? ''}`);
    }
  }

  // 链式处理：成功继续、失败短路
  const chain = parsePort('3000');
  const port = chain.ok ? chain.value : 0;
  console.log('     成功分支取值：', port);
}

/** 8. 异步错误 */
async function demoAsync(): Promise<void> {
  // 8.1 async 函数内同步 throw，对外表现为 rejected Promise
  const asyncThrow = async (): Promise<void> => {
    throw new NetworkError('async 内抛错');
  };
  try {
    await asyncThrow();
  } catch (error: unknown) {
    console.log('     await + try/catch：', toError(error).message);
  }

  // 8.2 .catch 回调形式
  await asyncThrow().catch((error: unknown) => {
    console.log('     .catch 回调：', toError(error).message);
  });

  // 8.3 allSettled：批量任务，单个失败不影响其他结果
  const settled = await Promise.allSettled([
    sleep(10).then(() => '任务A成功'),
    Promise.reject(new NetworkError('任务B失败')),
    sleep(5).then(() => '任务C成功'),
  ]);
  for (const [index, item] of settled.entries()) {
    if (item.status === 'fulfilled') {
      console.log(`     allSettled[${index}] fulfilled:`, item.value);
    } else {
      console.log(`     allSettled[${index}] rejected:`, toError(item.reason).message);
    }
  }

  // 8.4 all：任一失败即整体失败（快失败），需要全部结果时改用 allSettled
  try {
    await Promise.all([sleep(5).then(() => 'ok'), Promise.reject(new ValidationError('整体失败', {})), sleep(50)]);
  } catch (error: unknown) {
    console.log('     Promise.all 快失败：', toError(error).message);
  }
}

/** 9. 重试与超时 */
async function demoRetryAndTimeout(): Promise<void> {
  const flaky = createFlakyApi(2);
  const result = await retry(flaky, {
    retries: 3,
    baseDelayMs: 20,
    // 只对网络错误重试
    shouldRetry: (error: unknown) => isAppError(error) && error.code === 'NETWORK',
  });
  console.log('     重试最终结果：', result);

  // 不可重试的错误：一次就放弃
  await retry(
    async () => {
      throw new ValidationError('参数错误不该重试', { id: '非法' });
    },
    { retries: 5, baseDelayMs: 10, shouldRetry: (e: unknown) => isAppError(e) && e.code === 'NETWORK' },
  ).catch((error: unknown) => console.log('     放弃重试：', toError(error).message));

  // 超时
  try {
    await withTimeout(sleep(200).then(() => '慢任务完成'), 50, '慢任务');
  } catch (error: unknown) {
    console.log('     超时捕获：', toError(error).message);
  }

  console.log('     正常任务：', await withTimeout(sleep(10).then(() => '快任务完成'), 100, '快任务'));
}

/** 10. 资源清理 */
interface FakeConnection {
  id: string;
  closed: boolean;
}

function openConnection(id: string): FakeConnection {
  console.log(`     打开连接 ${id}`);
  return { id, closed: false };
}

function closeConnection(conn: FakeConnection): void {
  conn.closed = true;
  console.log(`     关闭连接 ${conn.id}，closed=${conn.closed}`);
}

function demoCleanup(): void {
  let conn: FakeConnection | undefined;
  try {
    conn = openConnection('conn-1');
    throw new NetworkError('使用连接时发生异常');
  } catch (error: unknown) {
    console.log('     捕获业务异常：', toError(error).message);
  } finally {
    // 无论成功失败都必须释放；conn 可能未创建，需判空
    if (conn !== undefined) closeConnection(conn);
  }

  console.log('     提示：TS 5.2+ 的 using / await using 可在作用域结束时自动释放，');
  console.log('           但需要对象实现 [Symbol.dispose] / [Symbol.asyncDispose]，且运行时需支持');
}

/** 11. 坑位 */
function demoPitfalls(): void {
  console.log('     - 不要空 catch：catch {} 会吞掉错误，至少记录或重新抛出');
  console.log('     - 不要用 catch 处理可预期的分支逻辑，改用返回值 / Result');
  console.log('     - catch 里再抛要保留 cause，避免丢失根因：throw new X(msg, { cause: error })');
  console.log('     - finally 里的 return 会覆盖 try 的返回值，不要这样写');
  console.log('     - forEach(async () => {}) 内部的 reject 不会被外层 await 捕获，改用 for...of + await');
  console.log('     - 异步代码务必 return / await 内部 Promise，否则错误逃逸成 unhandledRejection');
  console.log('     - 重试要有上限与退避，且只对幂等、可恢复错误重试');
}

// ============================================================================
// 主流程：每一步独立兜底，单个步骤异常不中断整体演示
// ============================================================================

type Step = readonly [title: string, action: () => void | Promise<void>];

async function main(): Promise<void> {
  const steps: Step[] = [
    ['1) try / catch / finally 基础', demoBasic],
    ['2) catch 变量是 unknown，必须收窄', demoUnknownCatch],
    ['3) throw 规则与 never', demoThrow],
    ['4) 自定义错误体系（code / cause / 子类）', demoCustomErrors],
    ['5) 按类型与错误码分派（穷尽检查）', demoDispatch],
    ['6) 错误归一化 toError', demoNormalize],
    ['7) Result 风格：错误即返回值', demoResult],
    ['8) 异步错误处理', demoAsync],
    ['9) 重试、退避与超时', demoRetryAndTimeout],
    ['10) 资源清理 finally', demoCleanup],
    ['11) 常见坑位', demoPitfalls],
  ];

  for (const [title, action] of steps) {
    console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
    try {
      await action();
    } catch (error: unknown) {
      // 演示脚本兜底：真实项目里这里应上报监控
      console.error('   步骤异常（演示继续）：', toError(error).message);
    }
  }

  console.log('\n=== 演示结束 ===');
}

main().catch((error: unknown) => {
  console.error('未捕获错误：', toError(error));
  process.exitCode = 1;
});
