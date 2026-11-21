/**
 * ============================================================================
 * TypeScript null 与 undefined 全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-null-undefined-demo.ts
 *
 * 类型校验（反例均为编译期错误，不会执行）：
 *   npx tsc --noEmit
 *
 * 覆盖清单：
 *   1. 本质区别：null 是「显式空值」，undefined 是「缺失 / 未赋值」
 *   2. undefined 的 6 个常见来源
 *   3. null 的常见来源
 *   4. strictNullChecks：null / undefined 不再能悄悄赋给具体类型
 *   5. 可选属性 vs 显式 undefined（exactOptionalPropertyTypes）
 *   6. 可选参数、默认参数：为什么默认值只对 undefined 生效
 *   7. 安全访问三件套：?. / ?? / ??=
 *   8. 类型收窄：typeof / == null / in / 类型守卫 / 断言函数
 *   9. 非空断言 ! 的风险
 *   10. 编译期断言
 *   11. 运行时坑位（typeof null、JSON、数组空洞、宽松相等）
 *   12. 常见编译错误（反例集合）
 * ============================================================================
 */

// 类型层面的工具：判断两类型是否相同、判断是否可为 null / undefined
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
type IsNullable<T> = null extends T ? true : false;
type IsUndefinedable<T> = undefined extends T ? true : false;

// ============================================================================
// 1. 本质区别
//    - null：一个「有值」的空值，表示主动标记的「空」（数据库 NULL、JSON null）
//    - undefined：表示「还没有值 / 不存在」，是 JS 引擎默认产生的缺失语义
//    - null 是 object 的 typeof 结果（历史 bug，永远不要用它判空）
// ============================================================================
const explicitEmpty: null = null;
const notAssigned: undefined = undefined;

function essentialDifference(): void {
  console.log('1) 本质区别');
  console.log('   typeof null =', typeof explicitEmpty, '（历史遗留 bug，不能用来判空）');
  console.log('   typeof undefined =', typeof notAssigned);
  console.log('   null == undefined →', null == undefined, '（宽松相等视为相同）');
  console.log('   null === undefined →', null === undefined, '（严格相等视为不同）');
  console.log('   Number(null) =', Number(null), '/ Number(undefined) =', Number(undefined));
  console.log('   `void 0` 是获取 undefined 最安全的方式：', void 0 === undefined);
}

// ============================================================================
// 2. undefined 的 6 个常见来源
//    undefined 往往不是你写的，而是「没写」导致的
// ============================================================================
function undefinedSources(): void {
  console.log('\n2) undefined 的来源');

  // 来源 1：声明了但没赋值
  let unassigned: string | undefined;
  console.log('   1) 未赋值的 let：', unassigned);

  // 来源 2：函数没有走到任何 return
  function maybeReturn(flag: boolean) {
    if (flag) {
      return 'ok';
    }
    // 缺省分支隐式返回 undefined，推断为 string | undefined
  }
  console.log('   2) 未命中 return 的函数：', maybeReturn(false));

  // 来源 3：访问不存在的属性
  const config: { host: string; port?: number } = { host: 'localhost' };
  console.log('   3) 不存在的可选属性：', config.port);

  // 来源 4：调用时省略可选参数
  function logName(name?: string): string {
    return name === undefined ? '（未传）' : name;
  }
  console.log('   4) 省略可选参数：', logName());

  // 来源 5：数组越界 / 稀疏数组的空洞
  const nums = [1, 2, 3];
  const sparse = [1, , 3];
  console.log('   5) 越界索引：', nums[99], '/ 空洞：', sparse[1], '/ 索引是否存在：', 1 in sparse);

  // 来源 6：delete 之后的属性
  const removable: { token?: string } = { token: 'abc' };
  delete removable.token;
  console.log('   6) delete 之后：', removable.token);
}

// ============================================================================
// 3. null 的常见来源
//    null 通常由「外部世界」或「显式设计」带来
// ============================================================================
function nullSources(): void {
  console.log('\n3) null 的来源');

  // 1) JSON 里的 null（接口返回、数据库字段）
  const parsed: unknown = JSON.parse('{"nickname":null}');
  console.log('   1) JSON 解析出的 null：', (parsed as { nickname: string | null }).nickname);

  // 2) String.prototype.match 找不到时返回 null（不是 undefined）
  console.log('   2) 正则不匹配：', 'abc'.match(/z/) === null);

  // 3) 原型链终点
  console.log('   3) Object.create(null) 的原型：', Object.getPrototypeOf(Object.create(null)));

  // 4) 显式表达「查无此值」，与 undefined 的「还没值」区分开
  function findUser(id: number): { id: number } | null {
    return id === 1 ? { id: 1 } : null;
  }
  console.log('   4) 查无结果返回 null：', findUser(2));
}

// ============================================================================
// 4. strictNullChecks
//    tsconfig 的 strict: true 已内置该选项：
//    null / undefined 变成独立的空类型，不再能悄悄混入 string、number 等
// ============================================================================
interface Person {
  name: string;
  // 可选属性：读取时类型是 Address | undefined，但写入时不允许显式 undefined
  address?: Address;
}

interface Address {
  city: string;
  // 索引签名读取时也会被 noUncheckedIndexedAccess 加上 undefined
}

interface StrictDemo {
  id: number;
  nickname?: string;
  // 想允许显式写 undefined，必须把它写进类型
  remark?: string | undefined;
}

function strictDemo(): void {
  console.log('\n4) strictNullChecks');

  const person: Person = { name: 'Alice', address: { city: '上海' } };
  // 读取可选属性得到 Address | undefined，必须自己处理
  const city: string | undefined = person.address?.city;
  console.log('   读取可选属性拿到 string | undefined：', city);

  // 显式写入 undefined 只对「类型里含 undefined」的属性合法
  const demo: StrictDemo = { id: 7, remark: undefined };
  console.log('   remark 允许显式 undefined：', demo.remark);

  // noUncheckedIndexedAccess 打开后，索引访问也带 undefined
  const scoreMap: Record<string, number> = { math: 90 };
  const chineseScore: number | undefined = scoreMap['chinese'];
  console.log('   索引访问结果含 undefined：', chineseScore);
}

// ============================================================================
// 5. 可选属性 vs 显式 undefined
//    exactOptionalPropertyTypes: true 时
//    { age?: number }        → 只能「不写」age，不能写 age: undefined
//    { age?: number | undefined } → 可以显式写 undefined
// ============================================================================
interface OptionalAge {
  name: string;
  age?: number; // 不写 age 才是合法的「没有」
}

interface NullableAge {
  name: string;
  age: number | null; // 必填，但值可以是 null，用于「明确知道为空」
}

function optionalVersusUndefined(): void {
  console.log('\n5) 可选属性 vs 显式 undefined');

  const a: OptionalAge = { name: 'Alice' };
  const b: NullableAge = { name: 'Bob', age: null };
  console.log('   省略可选属性：', a.age, '/ 显式 null：', b.age);

  // 序列化时差异明显：缺失字段直接消失，null 字段保留
  console.log('   序列化结果：', JSON.stringify(a), JSON.stringify(b));
}

// ============================================================================
// 6. 可选参数与默认参数
//    - 可选参数 name?: string      → 调用方可省略，函数内类型含 undefined
//    - 默认参数 name = '匿名'      → 函数内类型不含 undefined，只有传 undefined 才触发默认值
//    - 传 null 两者都不接受（编译期就报错）
// ============================================================================
function greetOptional(name?: string): string {
  return `你好，${name ?? '匿名'}`;
}

function greetDefault(name = '匿名'): string {
  // 有默认值，所以 name 的类型是 string，不需要再判空
  return `你好，${name}`;
}

function parameterDemo(): void {
  console.log('\n6) 可选参数与默认参数');
  console.log('   可选参数省略：', greetOptional(), '/ 传 undefined：', greetOptional(undefined));
  console.log('   默认参数省略：', greetDefault(), '/ 传 undefined 也走默认：', greetDefault(undefined));
  console.log('   注意：默认值只对 undefined 生效，null 会原样保留（但编译期不允许传 null）');
}

// ============================================================================
// 7. 安全访问三件套：?. / ?? / ??=
//    - ?.  短路取值：链路上遇到 null / undefined 立刻返回 undefined
//    - ??  空值合并：只在 null / undefined 时取右侧（0、"", false 都会保留）
//    - ??= 空值赋默认：左侧为 null / undefined 时才赋值
// ============================================================================
interface Profile {
  name: string;
  address?: { city?: string };
}

function safeAccessDemo(): void {
  console.log('\n7) ?. / ?? / ??=');

  const full: Profile = { name: 'Alice', address: { city: '杭州' } };
  const empty: Profile = { name: 'Bob' };

  console.log('   ?. 逐层取值：', full.address?.city, '/', empty.address?.city);
  console.log('   ?? 兜底：', empty.address?.city ?? '未知城市');

  // ?? 与 || 的分水岭：0 / '' / false 是有效值
  const zero = 0;
  const blank = '';
  console.log('   || 会误判：', zero || '默认', JSON.stringify(blank || '默认'));
  console.log('   ?? 只认空值：', zero ?? '默认', JSON.stringify(blank ?? '默认'));

  // 可选调用 ?.()
  function callOptional(fn: ((n: number) => string) | undefined): string {
    // 参数不会被控制流收窄成 never，可真实演示 ?.() 的短路行为
    return fn?.(1) ?? '没有格式化函数';
  }
  console.log('   可选调用 ?.()：', callOptional(undefined), '/', callOptional((n) => `#${n}`));

  // 可选下标 ?.[]
  const dict: Record<string, string> | undefined = { a: '1' };
  console.log('   可选下标 ?.[]：', dict?.['a'] ?? '无', '/ 缺失键：', dict?.['b'] ?? '无');

  // ??= 只在左侧为空时赋值
  let cache: string | undefined;
  cache ??= '初始化';
  cache ??= '不会被覆盖';
  console.log('   ??= 结果：', cache);

  let hit = 0;
  hit ??= 99;
  console.log('   ??= 不误伤 0：', hit);
}

// ============================================================================
// 8. 类型收窄
//    常见手段：typeof、=== null、== null、in、类型守卫、断言函数
// ============================================================================
// 类型守卫：把「非空」判断封装成可复用的谓词
function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// 断言函数：不通过就抛错，后续代码可以直接使用非空值
function assertPresent<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value == null) {
    throw new Error(message);
  }
}

function narrowingDemo(): void {
  console.log('\n8) 类型收窄');

  // 8.1 == null 一次同时排除 null 和 undefined（最常用写法）
  function lengthOrEmpty(value: string | null | undefined): string {
    if (value == null) {
      return '空值';
    }
    return `长度 ${value.length}`;
  }
  console.log('   == null 收窄：', lengthOrEmpty('abc'), '/', lengthOrEmpty(null), '/', lengthOrEmpty(undefined));

  // 8.2 typeof 收窄联合类型
  function double(value: number | string | null | undefined): number {
    if (typeof value === 'number') {
      return value * 2;
    }
    if (typeof value === 'string') {
      return Number(value) * 2;
    }
    return 0;
  }
  console.log('   typeof 收窄：', double(3), double('4'), double(null));

  // 8.3 类型守卫：filter 后可以用 map 直接取值
  const raw: (string | null | undefined)[] = ['a', null, 'b', undefined];
  const cleaned: string[] = raw.filter(isPresent);
  console.log('   类型守卫过滤：', cleaned.join(','));

  // 8.4 断言函数：失败抛错，成功后续无需再判空
  const loaded: string | null = '已加载';
  try {
    assertPresent(loaded, '数据缺失');
    console.log('   断言函数后可直接使用：', loaded.length);
    assertPresent(null, '这里会抛错');
  } catch (error) {
    console.log('   断言失败：', (error as Error).message);
  }

  // 8.5 in 收窄可选属性
  const payload: { data?: { id: number } } = { data: { id: 9 } };
  if ('data' in payload && payload.data !== undefined) {
    console.log('   in 收窄后可访问：', payload.data.id);
  }
}

// ============================================================================
// 9. 非空断言 !
//    只骗过编译器，不改变运行时；值为 null / undefined 时照旧崩
//    仅在有十足把握（例如已完成校验、框架保证）时使用
// ============================================================================
function unsafeAssertion(): void {
  const maybe: string | null = null;
  // 编译通过，运行时报 TypeError: Cannot read properties of null
  console.log(maybe!.length);
}

// 引用即可，不调用；想验证风险可临时手动调用
void unsafeAssertion;

// ============================================================================
// 10. 编译期断言
//     证明 strictNullChecks 生效、可选属性与返回类型推断符合预期
// ============================================================================
function assertDemo(): void {
  console.log('\n10) 编译期断言');

  type ReturnOfMaybe = ReturnType<typeof maybeReturnForAssert>;

  const checks: true[] = [
    true as Expect<Equal<IsNullable<string | null>, true>>,
    true as Expect<Equal<IsUndefinedable<string | undefined>, true>>,
    // strict 打开后 null 不属于 string
    true as Expect<Equal<IsNullable<string>, false>>,
    // 可选属性读取类型是 T | undefined
    true as Expect<Equal<IsUndefinedable<Person['address']>, true>>,
    // 未命中 return 的函数推断为字面量 'ok' | undefined
    true as Expect<Equal<ReturnOfMaybe, 'ok' | undefined>>,
    // 有默认值的参数类型不含 undefined
    true as Expect<Equal<Parameters<typeof greetDefault>[0], string | undefined>>,
  ];

  console.log('   通过断言数：', checks.length);
}

// 仅供编译期断言使用
function maybeReturnForAssert(flag: boolean) {
  if (flag) {
    return 'ok';
  }
}

// ============================================================================
// 11. 运行时坑位
// ============================================================================
function runtimePitfalls(): void {
  console.log('\n11) 运行时坑位');

  // 坑 1：typeof null === 'object'，判空只能用 === null 或 == null
  console.log('   typeof null：', typeof null, '→ 不要用 typeof 判 null');

  // 坑 2：JSON.stringify 会丢掉 undefined 属性，把 null 保留
  console.log('   JSON 序列化：', JSON.stringify({ a: undefined, b: null }));
  console.log('   JSON.stringify(undefined) 直接返回 undefined：', JSON.stringify(undefined) === undefined);

  // 坑 3：'key' in obj 与 obj.key !== undefined 语义不同
  const own: Record<string, number | undefined> = { a: undefined };
  console.log('   存在键但值为 undefined：', 'a' in own, '/ 取值为：', own['a']);

  // 坑 4：宽松相等里 null 只等于 undefined
  console.log('   null == 0 →', (null as unknown as number) == 0, '/ null == false →', (null as unknown as boolean) == false);
  console.log('   所以判空请用 == null，而不是 == 0 / !value');

  // 坑 5：!value 会把 0、''、false 一并当成空
  console.log('   !0 =', !0, '→ 数值场景请用 value == null');

  // 坑 6：可选链只拦 null / undefined，拦不住其他 falsy 或缺失方法
  const objWithNull = { nested: null as { x?: number } | null };
  console.log('   ?. 只短路 null/undefined：', objWithNull.nested?.x ?? '短路了');

  // 坑 7：数组方法返回 undefined / -1，需要显式处理
  const found = [1, 2, 3].find((n) => n > 10);
  console.log('   find 未命中：', found, '/ findIndex 未命中：', [1, 2, 3].findIndex((n) => n > 10));
}

// ============================================================================
// 12. 常见编译错误（反例只在编译期校验，不会被调用）
// ============================================================================
function typeErrorCases(): void {
  // 1) strict 下 null / undefined 不能赋给具体类型
  // @ts-expect-error null 不能赋给 string
  const nullToString: string = null;

  // @ts-expect-error undefined 不能赋给 number
  const undefinedToNumber: number = undefined;

  // 2) 必填参数不能漏传 undefined
  function needString(value: string): string {
    return value;
  }
  // @ts-expect-error 必填参数不接受 undefined
  needString(undefined);

  // 3) 默认参数的类型是 string，不接受 null
  // @ts-expect-error null 不触发默认值，编译期即报错
  greetDefault(null);

  // 4) noUncheckedIndexedAccess：索引访问结果含 undefined
  const nums = [1, 2, 3];
  // @ts-expect-error nums[0] 是 number | undefined
  const first: number = nums[0];

  // 5) exactOptionalPropertyTypes：可选属性不能显式写 undefined
  // @ts-expect-error age?: number 不允许写成 age: undefined
  const badOptional: OptionalAge = { name: 'Alice', age: undefined };

  // 6) 可选链结果不能直接当具体类型用
  const person: Person = { name: 'Alice' };
  // @ts-expect-error 可选链结果可能为 undefined
  const city: string = person.address?.city;

  // 引用即可，保证不被标记为未使用
  void nullToString;
  void undefinedToNumber;
  void first;
  void badOptional;
  void city;
}

// 引用即可，实际不调用
void typeErrorCases;

// ============================================================================
// 主程序
// ============================================================================
function main(): void {
  essentialDifference();
  undefinedSources();
  nullSources();
  strictDemo();
  optionalVersusUndefined();
  parameterDemo();
  safeAccessDemo();
  narrowingDemo();
  assertDemo();
  runtimePitfalls();
  console.log('\n12) 常见编译错误：反例见 typeErrorCases()，均为编译期报错');
}

main();
