/**
 * ============================================================================
 * TypeScript 特殊类型全演示：never / void / unknown / any
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-special-types-demo.ts
 *
 * 类型校验（反例均为编译期错误，不会执行）：
 *   npx tsc --noEmit
 *
 * 覆盖：
 *   1. any：关闭类型检查，并具有传染性
 *   2. unknown：安全的上位类型，使用前必须收窄
 *   3. any 与 unknown 的对比
 *   4. never：空集类型（抛错函数 / 穷尽检查 / 联合类型吸收）
 *   5. void：无返回值（回调 / 与 undefined 的区别）
 *   6. void 的实际用途：忽略返回值的回调
 *   7. 四类特殊类型对比表
 *   8. 编译期断言
 *   9. 常见坑位
 * ============================================================================
 */

// 类型层面的工具：判断是否为 any、判断两类型是否相同
type IsAny<T> = 0 extends 1 & T ? true : false;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// ============================================================================
// 1. any：关闭类型检查
//    - any 会「跳过」一切类型检查，读写任意属性、调用任意方法都不报错
//    - any 具有传染性：任何与 any 运算的结果都会变成 any
//    - 只有在迁移旧代码、对接无类型第三方库时才考虑使用
// ============================================================================
const anyValue: any = { nested: { deep: 'value' } };

function anyDemo(): void {
  console.log('1) any：关闭类型检查');

  // 访问不存在的属性、调用不存在的方法都不会报错
  console.log('   访问不存在的属性也是 any：', anyValue.notExist);
  console.log('   anyValue.notExist.alsoMissing() 也不会报错（此处不执行）');

  // 传染性：any 参与运算后结果仍是 any
  const derived = anyValue.nested.deep + 1; // any + number => any
  console.log('   any 参与运算结果仍是 any：', typeof derived);

  // any 可以被赋给任意类型，反向也成立
  const asString: string = anyValue;
  const asNumber: number = anyValue;
  console.log('   any 可赋给任意类型：', typeof asString, typeof asNumber);

  // 风险：编译器完全不保护你，只能靠运行时才发现问题
  console.log('   any 的真实类型要靠运行时才知道：', typeof anyValue.nested.deep);
}

// ============================================================================
// 2. unknown：安全的上位类型
//    - 可以接收任意值（这点和 any 一样）
//    - 但使用前必须收窄，无法直接读写属性 / 调用方法 / 赋值给具体类型
//    - 是「外部输入」的首选类型：接口响应、JSON.parse、catch 变量
// ============================================================================
const unknownValue: unknown = { nested: { deep: 'value' } };

function unknownDemo(): void {
  console.log('\n2) unknown：安全的上位类型');

  // 必须先用 typeof / instanceof / 自定义守卫收窄
  if (typeof unknownValue === 'object' && unknownValue !== null) {
    const record = unknownValue as Record<string, unknown>;
    console.log('   收窄后可安全读取：', typeof record['nested']);
  }

  // 收窄成具体类型后才能赋值
  const input: unknown = 'hello';
  if (typeof input === 'string') {
    const upper: string = input.toUpperCase(); // 此分支内 input 是 string
    console.log('   typeof 收窄后可用字符串方法：', upper);
  }

  // catch 变量在 strict 下默认是 unknown，必须收窄才能取 message
  try {
    throw new Error('出错了');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('   catch 变量是 unknown，需 instanceof 收窄：', error.message);
    }
  }

  // 安全解析：外部数据的入口统一用 unknown 承接
  console.log('   safeParse 结果：', JSON.stringify(safeParse('{"id":1,"name":"Tom"}')));
}

// 外部输入 → unknown，返回明确结构，把「不可信」挡在边界外
function safeParse(text: string): { id: number; name: string } | null {
  const raw: unknown = JSON.parse(text);
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'id' in raw &&
    'name' in raw &&
    typeof (raw as { id: unknown }).id === 'number' &&
    typeof (raw as { name: unknown }).name === 'string'
  ) {
    const parsed = raw as { id: number; name: string };
    return { id: parsed.id, name: parsed.name };
  }
  return null;
}

// ============================================================================
// 3. any 与 unknown 的对比
//    - 赋值方向：都能接收任意值
//    - 使用方式：any 随便用；unknown 必须先收窄
//    - 安全性：any 关闭检查；unknown 保留检查
// ============================================================================
function compareAnyAndUnknown(): void {
  console.log('\n3) any vs unknown：');

  const fromAny: any = 'text';
  const fromUnknown: unknown = 'text';

  // any 直接可用（危险）
  console.log('   any 直接调用方法：', fromAny.toUpperCase());

  // unknown 必须先判断
  console.log(
    '   unknown 收窄后调用方法：',
    typeof fromUnknown === 'string' ? fromUnknown.toUpperCase() : '不是字符串',
  );

  console.log('   IsAny<any> =', true, '（编译期断言见第 8 节）');
}

// ============================================================================
// 4. never：空集类型
//    - 表示「永远不会正常返回」，是所有类型的子类型，可赋给任意类型
//    - 常见来源：抛错函数、无限循环函数、穷尽检查后的剩余分支
//    - 联合类型中 never 会被吸收：T | never = T
// ============================================================================
function fail(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {
    // 永不返回
  }
}

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

// 穷尽检查：所有分支都处理完后，参数类型只剩 never
function assertNever(value: never): never {
  throw new Error(`未处理的分支：${JSON.stringify(value)}`);
}

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rect':
      return shape.width * shape.height;
    default:
      // 若新增了 kind 却没处理，这里会编译报错（参数不是 never）
      return assertNever(shape);
  }
}

function neverDemo(): void {
  console.log('\n4) never：空集类型');

  try {
    fail('业务中断');
  } catch (e) {
    console.log('   抛错函数返回 never：', (e as Error).message);
  }

  // never 可赋给任意类型（因为它不存在任何值）；包成函数声明类型即可，不实际调用
  const neverToNumber: () => number = () => fail('赋值表达式永远执行不到');
  console.log('   never 可赋给 number：', typeof neverToNumber);

  console.log('   穷尽检查 area(circle)：', area({ kind: 'circle', radius: 2 }).toFixed(1));
  console.log('   穷尽检查 area(rect)：', area({ kind: 'rect', width: 2, height: 3 }));
  console.log('   typeof infiniteLoop：', typeof infiniteLoop);
}

// ============================================================================
// 5. void：无返回值
//    - 函数不返回有意义的值时使用
//    - void ≠ undefined：void 表示「不用关心返回值」，undefined 是一个具体值
//    - 返回 void 的函数，实现里 return 具体值会报错
// ============================================================================
function logMessage(message: string): void {
  console.log('   [log]', message);
}

function voidDemo(): void {
  console.log('\n5) void：无返回值');

  const result = logMessage('hello'); // result 的类型是 void
  console.log('   调用的返回值类型是 void：', result);
  console.log('   void 值实际是 undefined：', result === undefined);

  // void 只能接收 undefined
  const voidValue: void = undefined;
  console.log('   void 变量只能赋 undefined：', voidValue === undefined);
}

// ============================================================================
// 6. void 的实际用途：忽略返回值的回调
//    - 目标类型为 () => void 时，可以传入返回任意值的函数
//    - 语义是「我不关心你返回什么」，因此返回值被忽略
//    - 这让 forEach / 事件监听 / 定时器回调更灵活
// ============================================================================
type Notifier = (message: string) => void;

function notify(callback: Notifier): void {
  callback('构建完成');
}

function voidCallbackDemo(): void {
  console.log('\n6) void 的实际用途：');

  // 回调返回 number 也合法，返回值被丢弃
  notify((msg) => {
    console.log('   收到通知：', msg);
    return 123;
  });

  // 数组 forEach 的回调签名本身就是 void
  const list = ['a', 'b'];
  const collected: string[] = [];
  list.forEach((item) => collected.push(item)); // push 返回 number，被忽略
  console.log('   forEach 中 push 的返回值被忽略：', collected.join(','));

  // 显式声明返回 void 的函数不能返回具体值（反例见 typeErrorCases）
  const sideEffect: () => void = () => {
    collected.length = 0; // 只做副作用，不返回值
  };
  sideEffect();
  console.log('   副作用执行后长度：', collected.length);
}

// ============================================================================
// 7. 四类特殊类型对比表
// ============================================================================
function summaryDemo(): void {
  console.log('\n7) 四类特殊类型对比：');
  const rows: Array<[string, string, string]> = [
    ['any', '任意值', '读/写/调用全部放行，且传染'],
    ['unknown', '任意值', '可接收任意值，使用前必须收窄'],
    ['never', '无值', '函数永不正常返回；可赋给任意类型'],
    ['void', '无返回', '函数无返回值；回调可忽略返回值'],
  ];
  console.log('   类型     取值集合      核心行为');
  for (const [name, valueSet, behavior] of rows) {
    console.log(`   ${name.padEnd(8)} ${valueSet.padEnd(10)} ${behavior}`);
  }
}

// ============================================================================
// 8. 编译期断言：把关键结论固化为类型测试
// ============================================================================
type _CheckAny = Expect<IsAny<typeof anyValue>>;
type _CheckUnknown = Expect<Equal<typeof unknownValue, unknown>>;
type _CheckFailReturn = Expect<Equal<ReturnType<typeof fail>, never>>;
type _CheckLogReturn = Expect<Equal<ReturnType<typeof logMessage>, void>>;
type _CheckNeverAbsorbed = Expect<Equal<string | never, string>>;
// void 与 undefined 不相等：虽然 void 值运行时就是 undefined
type _CheckVoidNotUndefined = Expect<Equal<Equal<void, undefined>, false>>;
// unknown 不是任意类型的子类型，因此不能反向推导出 string
type _CheckUnknownNotString = Expect<Equal<Equal<unknown, string>, false>>;

function assertDemo(): void {
  const checks: true[] = [
    true as _CheckAny,
    true as _CheckUnknown,
    true as _CheckFailReturn,
    true as _CheckLogReturn,
    true as _CheckNeverAbsorbed,
    true as _CheckVoidNotUndefined,
    true as _CheckUnknownNotString,
  ];
  console.log('\n8) 编译期断言通过数：', checks.length);
}

// ============================================================================
// 9. 常见坑位（反例只在编译期校验，不会被调用）
// ============================================================================
function typeErrorCases(): void {
  // 坑 1：unknown 不能直接使用
  // @ts-expect-error unknown 不能直接当 string 用
  unknownValue.toUpperCase();

  // @ts-expect-error unknown 不能直接赋给 string
  const badAssign: string = unknownValue;
  void badAssign;

  // 坑 2：声明返回 void 的函数不能 return 具体值
  function badVoid(): void {
    // @ts-expect-error 返回类型是 void，不能 return 值
    return 1;
  }
  void badVoid;

  // 坑 3：声明返回 never 的函数不能正常返回
  function badNever(): never {
    // @ts-expect-error never 函数不能有返回值
    return 'x';
  }
  void badNever;

  // 坑 4：any 会污染推导链，把类型安全一路带崩
  const anything: any = 'text';
  const polluted = anything.length + 1; // 类型为 any，编译期无任何保护
  void polluted;

  // 坑 5：联合类型里写 never 没有意义，会被直接吸收
  type Useless = string | never; // 等价于 string
  const useless: Useless = 'only string';
  void useless;
}

// 引用即可，保证不被标记为未使用；实际不调用
void typeErrorCases;

// ============================================================================
// 主程序
// ============================================================================
function main(): void {
  anyDemo();
  unknownDemo();
  compareAnyAndUnknown();
  neverDemo();
  voidDemo();
  voidCallbackDemo();
  summaryDemo();
  assertDemo();
  console.log('\n9) 常见坑位：反例均为编译期错误，见 typeErrorCases()');
}

main();
