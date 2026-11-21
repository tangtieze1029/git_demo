/**
 * ============================================================================
 * TypeScript 类型收窄与守卫全演示：typeof / in / instanceof / is X
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-type-guards-demo.ts
 *
 * 类型校验（下面注释掉的反例均为编译期错误，不会执行）：
 *   npx tsc --noEmit
 *
 * 覆盖清单：
 *   1.  为什么需要收窄：联合类型 / unknown 上不能直接调用成员
 *   2.  typeof 收窄：8 种返回值 + null / 数组两个坑
 *   3.  in 收窄：按属性存在性区分对象形状
 *   4.  instanceof 收窄：类实例与内置构造器
 *   5.  自定义类型守卫：value is X
 *   6.  断言函数：asserts value is X
 *   7.  可辨识联合 + 穷尽检查
 *   8.  组合守卫：数组守卫 / 可空对象守卫（真实 API 场景）
 *   9.  const 别名收窄（TS 4.4+）
 *   10. 常见坑位汇总
 * ============================================================================
 */

// ============================================================================
// 1. 为什么需要收窄
//    - 联合类型上的成员只有「所有分支都有」才可直接访问
//    - unknown 上任何成员都不可访问，必须先收窄
// ============================================================================

type Id = string | number;

function demoWhy(): void {
  console.log('   联合类型上直接调用成员是编译错误（见源码注释）：');
  // id.toUpperCase(); // ❌ number 上没有 toUpperCase
  // id.toFixed(2);    // ❌ string 上没有 toFixed

  const ids: Id[] = ['abc', 42];
  for (const id of ids) {
    // 收窄后各自分支只保留一种类型，成员访问才合法
    if (typeof id === 'string') {
      console.log('     string 分支：', id.toUpperCase());
    } else {
      console.log('     number 分支：', id.toFixed(2));
    }
  }

  const input: unknown = '外部输入';
  // input.length; // ❌ unknown 上不存在 length
  if (typeof input === 'string') {
    console.log('     unknown 收窄后可读 length：', input.length);
  }
}

// ============================================================================
// 2. typeof 收窄
//    - typeof 共 8 种结果：string / number / boolean / bigint / symbol /
//      undefined / function / object
//    - 坑 1：typeof null === 'object'，所以 object 分支必须再判 null
//    - 坑 2：数组、Date、Map 的 typeof 都是 'object'，需 Array.isArray / instanceof
// ============================================================================

function describe(value: unknown): string {
  if (typeof value === 'string') return `string(len=${value.length})`;
  if (typeof value === 'number') return `number(${value.toFixed(1)})`;
  if (typeof value === 'boolean') return `boolean(${String(value)})`;
  if (typeof value === 'bigint') return `bigint(${value + 1n})`;
  if (typeof value === 'symbol') return `symbol(${value.description ?? 'anonymous'})`;
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'function') return `function(${value.name})`;

  // 到这里只剩 'object'：可能是 null、数组、Date、普通对象……
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array(len=${value.length})`;
  return `object(${JSON.stringify(value)})`;
}

function demoTypeof(): void {
  const samples: unknown[] = ['hi', 3.14, true, 10n, Symbol('s'), undefined, (x: number) => x, null, [1, 2], { a: 1 }];
  for (const sample of samples) {
    console.log(`     typeof=${typeof sample} → ${describe(sample)}`);
  }

  console.log('     坑：typeof null === "object"：', typeof null);
  console.log('     坑：typeof [] === "object"：', typeof []);
}

// ============================================================================
// 3. in 收窄
//    - 按「属性是否存在」区分联合分支
//    - 只能用于对象类型；对可选属性（a?: T）的判别在 exactOptionalPropertyTypes
//      下要格外小心，优先用可辨识字段（kind / type）
// ============================================================================

interface EmailContact {
  email: string;
}

interface PhoneContact {
  phone: string;
}

type Contact = EmailContact | PhoneContact;

function formatContact(contact: Contact): string {
  if ('email' in contact) {
    // 此分支内 contact 已收窄为 EmailContact
    return `邮件：${contact.email}`;
  }
  // else 分支自动收窄为 PhoneContact
  return `电话：${contact.phone}`;
}

function demoIn(): void {
  const contacts: Contact[] = [{ email: 'a@b.com' }, { phone: '138-0000-0000' }];
  for (const contact of contacts) {
    console.log('     →', formatContact(contact));
  }
  console.log('     提示：in 做判别不如「可辨识联合」（见第 7 节）稳健');
}

// ============================================================================
// 4. instanceof 收窄
//    - 只对「类」和内置构造器有效：接口 / type 在运行时不复存在，不能用
//    - 是错误分派（Error 子类）与内置对象（Date / Map / RegExp）判别的主力
// ============================================================================

class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}

function classify(value: unknown): string {
  if (value instanceof HttpError) return `HttpError(${value.status})：${value.message}`;
  if (value instanceof Error) return `Error(${value.name})：${value.message}`;
  if (value instanceof Date) return `Date(${value.toISOString()})`;
  if (value instanceof Map) return `Map(size=${value.size})`;
  if (Array.isArray(value)) return `Array(len=${value.length})`;
  return `无法识别：${String(value)}`;
}

function demoInstanceof(): void {
  const values: unknown[] = [
    new HttpError('未授权', 401),
    new TypeError('类型不匹配'),
    new Date('2026-11-19T00:00:00Z'),
    new Map([['k', 1]]),
    [1, 2, 3],
    '纯字符串',
  ];
  for (const value of values) {
    console.log('     →', classify(value));
  }
  console.log('     注意：接口 / type 无运行时表示，instanceof 只认类与内置构造器');
}

// ============================================================================
// 5. 自定义类型守卫：value is X
//    - 返回值写成 `value is X`，让编译器在调用处自动收窄
//    - 守卫内部的校验逻辑由你自己保证，编译器不会验证它写得对不对
// ============================================================================

interface User {
  id: number;
  name: string;
  email?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUser(value: unknown): value is User {
  if (!isRecord(value)) return false;
  return typeof value['id'] === 'number' && typeof value['name'] === 'string' &&
    (value['email'] === undefined || typeof value['email'] === 'string');
}

function demoTypeGuard(): void {
  const candidates: unknown[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob' },
    { id: '3', name: 'Carl' }, // id 类型错误
    { name: 'Dora' }, // 缺 id
    null,
    '不是对象',
  ];

  for (const candidate of candidates) {
    if (isUser(candidate)) {
      // 收窄成功：可直接访问 User 的字段
      console.log(`     ✅ User#${candidate.id} ${candidate.name} <${candidate.email ?? '未提供'}>`);
    } else {
      console.log('     ❌ 不是 User：', JSON.stringify(candidate) ?? String(candidate));
    }
  }
}

// ============================================================================
// 6. 断言函数：asserts value is X
//    - 断言函数返回 void，但「不满足就抛错」，调用后变量被永久收窄
//    - 必须是函数声明并带显式类型标注；箭头函数写法会触发 TS2775
// ============================================================================

function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new TypeError(`期望 User，实际收到：${typeof value}`);
  }
}

function demoAssertion(): void {
  const payload: unknown = { id: 7, name: 'Grace' };

  // 下一行之前 payload 仍是 unknown
  assertIsUser(payload);
  // 断言通过后，后续代码里 payload 就是 User
  console.log(`     断言后直接访问：User#${payload.id} ${payload.name}`);

  try {
    const bad: unknown = { id: 1 };
    assertIsUser(bad);
  } catch (error: unknown) {
    console.log('     断言失败抛错：', error instanceof Error ? error.message : String(error));
  }
}

// ============================================================================
// 7. 可辨识联合 + 穷尽检查
//    - 每个分支带一个字面量 discriminant（kind / type / status）
//    - switch 全部覆盖后 default 分支的类型自动变成 never
//    - 新增分支却漏处理时，assertNever 处编译报错
// ============================================================================

type Shape =
  | { readonly kind: 'circle'; readonly radius: number }
  | { readonly kind: 'square'; readonly side: number }
  | { readonly kind: 'rect'; readonly width: number; readonly height: number };

function assertNever(value: never): never {
  throw new Error(`未处理的分支：${JSON.stringify(value)}`);
}

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.side ** 2;
    case 'rect':
      return shape.width * shape.height;
    default:
      // 少写一个 case 时，这里会编译报错（never 不可赋值）
      return assertNever(shape);
  }
}

function demoDiscriminatedUnion(): void {
  const shapes: Shape[] = [
    { kind: 'circle', radius: 2 },
    { kind: 'square', side: 3 },
    { kind: 'rect', width: 2, height: 5 },
  ];
  for (const shape of shapes) {
    console.log(`     ${shape.kind} 面积 = ${area(shape).toFixed(2)}`);
  }
  console.log('     新增 kind 却不处理 → default 分支的 assertNever 编译失败，漏分支无处藏身');
}

// ============================================================================
// 8. 组合守卫：数组守卫与真实 API 场景
//    - 先 isRecord 确认是对象，再逐字段校验
//    - 数组守卫用 Array.isArray + every，把元素守卫复用起来
// ============================================================================

type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}

function parseUserList(payload: unknown): ApiResult<User[]> {
  if (!isRecord(payload)) {
    return { ok: false, code: 'INVALID_PAYLOAD', message: '响应不是对象' };
  }

  // 逐字段收窄，不靠类型断言
  if (payload['ok'] !== true) {
    const error = payload['error'];
    const code = isRecord(error) && typeof error['code'] === 'string' ? error['code'] : 'UNKNOWN';
    const message = isRecord(error) && typeof error['message'] === 'string' ? error['message'] : '未知错误';
    return { ok: false, code, message };
  }

  const data = payload['data'];
  if (!isUserArray(data)) {
    return { ok: false, code: 'INVALID_DATA', message: 'data 不是合法的 User 数组' };
  }

  return { ok: true, data };
}

function demoComposite(): void {
  const responses: unknown[] = [
    { ok: true, data: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob', email: 'bob@example.com' }] },
    { ok: true, data: [{ id: 1, name: 42 }] },
    { ok: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
    'HTTP 500 的纯文本响应',
  ];

  for (const response of responses) {
    const result = parseUserList(response);
    if (result.ok) {
      // 收窄后可安全使用 data
      console.log(`     ✅ 解析到 ${result.data.length} 个用户：`, result.data.map((user) => user.name).join(', '));
    } else {
      console.log(`     ❌ ${result.code}：${result.message}`);
    }
  }
}

// ============================================================================
// 9. const 别名收窄（TS 4.4+）
//    - 把条件存进 const 变量，之后按该变量收窄也生效
//    - 前提：const 声明（let 不行）且不再重新赋值
// ============================================================================

function demoAliasedCondition(value: unknown): void {
  const isString = typeof value === 'string';
  if (isString) {
    // 别名收窄生效
    console.log('     const 别名收窄后可用字符串方法：', value.toUpperCase());
    return;
  }
  console.log('     非字符串：', typeof value);
}

function demoAliased(): void {
  demoAliasedCondition('alias works');
  demoAliasedCondition(123);
  console.log('     注意：let 变量或可被重新赋值的别名不会保留收窄');
}

// ============================================================================
// 10. 坑位
// ============================================================================

function demoPitfalls(): void {
  console.log('     - typeof null === "object"：object 分支必须先判 null');
  console.log('     - 数组 / Date / Map 的 typeof 都是 "object"：用 Array.isArray 或 instanceof');
  console.log('     - instanceof 对接口 / type / 跨 iframe 对象不可靠，接口此类场景改用 is X 守卫');
  console.log('     - `value is X` 是「向编译器打包票」：判空、字段校验写错时编译器不会救你');
  console.log('     - 断言函数（asserts）必须用函数声明 + 显式类型标注，箭头函数会 TS2775');
  console.log('     - 收窄只在当前作用域有效；中途重新赋值或传给回调后会失效');
  console.log('     - in 收窄适合临时区分，长期维护优先用可辨识联合 + assertNever');
  console.log('     - 布尔表达式本身不收窄，必须写成 if 条件或先存进 const 别名');
}

// ============================================================================
// 主流程：每一步独立兜底，单个步骤异常不中断整体演示
// ============================================================================

type Step = readonly [title: string, action: () => void];

function main(): void {
  const steps: Step[] = [
    ['1) 为什么需要收窄', demoWhy],
    ['2) typeof 收窄（含 null / 数组坑）', demoTypeof],
    ['3) in 收窄', demoIn],
    ['4) instanceof 收窄', demoInstanceof],
    ['5) 自定义类型守卫 is X', demoTypeGuard],
    ['6) 断言函数 asserts value is X', demoAssertion],
    ['7) 可辨识联合 + 穷尽检查', demoDiscriminatedUnion],
    ['8) 组合守卫：数组 / API 响应', demoComposite],
    ['9) const 别名收窄', demoAliased],
    ['10) 常见坑位', demoPitfalls],
  ];

  for (const [title, action] of steps) {
    console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
    try {
      action();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('   步骤异常（演示继续）：', message);
    }
  }

  console.log('\n=== 演示结束 ===');
}

main();
