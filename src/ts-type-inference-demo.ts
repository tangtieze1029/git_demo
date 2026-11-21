/**
 * ============================================================================
 * TypeScript 类型推断（Type Inference）全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-type-inference-demo.ts
 *
 * 类型校验（推断不符合预期时会在编译期报错）：
 *   npx tsc --noEmit
 *
 * 覆盖：
 *   1. 变量 / 常量推断与类型拓宽（widening）
 *   2. 字面量类型与 as const
 *   3. 数组与元组的推断
 *   4. 对象字面量推断
 *   5. 函数相关推断（返回值、默认值、可选参数、递归）
 *   6. 上下文类型推断（contextual typing）
 *   7. 泛型推断
 *   8. 类型收窄推断
 *   9. typeof / 工具类型观察推断结果
 *  10. satisfies：校验类型同时保留精确推断
 *  11. 常见坑位
 *  12. 编译期断言：把「推断结果」写成可校验的测试
 * ============================================================================
 */

// ============================================================================
// 编译期断言工具：Equal 判断两个类型是否完全相等
//   - 用「函数类型可比较」的技巧实现，避免条件类型分配导致的误判
// ============================================================================
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// ============================================================================
// 1. 变量 / 常量推断与类型拓宽
//    - let / var：会「拓宽」为更宽的类型（字面量 → string / number）
//    - const：变量本身无法重新赋值，但基本类型常量保留字面量类型
//    - 对象 / 数组的属性值仍会被拓宽（只有变量声明本身受 const 影响）
// ============================================================================
let mutableText = 'hello'; // 推断为 string（拓宽）
const constText = 'hello'; // 推断为字面量类型 'hello'
let mutableNum = 42; // 推断为 number（拓宽）
const constNum = 42; // 推断为字面量类型 42

// 推断结果就是字面量类型 'hello'，可以直接赋给同类型标注
const constLiteralCheck: 'hello' = constText;

// 用 let 承接 const 的值会重新拓宽
let widened = constText; // 推断为 string

function basicInferenceDemo(): void {
  console.log('1) 变量 / 常量推断与类型拓宽：');
  console.log('   let mutableText 推断为 string：', typeof mutableText);
  console.log('   const constText 推断为字面量类型 "hello"：', constText);
  console.log('   let mutableNum 推断为 number：', typeof mutableNum);
  console.log('   const constNum 推断为字面量类型 42：', constNum);
  console.log('   let 承接 const 值后重新拓宽：', typeof widened);
  console.log('   字面量类型可赋同类型标注：', constLiteralCheck);

  mutableText = 'world'; // string 可重新赋任意字符串
  console.log('   重新赋值后的 mutableText：', mutableText);

  // @ts-expect-error number 类型的变量不能赋 string（运行时不会执行）
  if (false) mutableNum = 'not a number';
}

// ============================================================================
// 2. 字面量类型与 as const
//    - as const：让字面量保持最窄类型，并把对象 / 数组变为只读
//    - 不加 as const 时，对象属性会被拓宽为 string / number
// ============================================================================
const plainConfig = { host: 'localhost', port: 3000 }; // { host: string; port: number }
const frozenConfig = { host: 'localhost', port: 3000 } as const; // { readonly host: "localhost"; readonly port: 3000 }
const frozenList = ['a', 'b'] as const; // readonly ["a", "b"]

function asConstDemo(): void {
  console.log('\n2) 字面量类型与 as const：');

  plainConfig.host = '127.0.0.1'; // 属性被拓宽为 string，可赋其它字符串
  console.log('   普通对象属性可修改：', plainConfig.host);

  // @ts-expect-error as const 后属性为只读（运行时不会执行，只读是编译期约束）
  if (false) frozenConfig.host = '127.0.0.1';

  console.log('   只读对象仍可读：', frozenConfig.host, frozenConfig.port);
  console.log('   只读数组（元组）内容：', frozenList.join(' / '));
}

// ============================================================================
// 3. 数组与元组的推断
//    - 同类型元素 → T[]
//    - 混合类型元素 → 最佳公共类型 (string | number)[]
//    - 显式元组 → 每个位置类型固定
//    - noUncheckedIndexedAccess 下，下标访问结果是 T | undefined
// ============================================================================
const numberList = [1, 2, 3]; // number[]
const mixedList = [1, 'a']; // (string | number)[]
const pairTuple: [string, number] = ['Tom', 18]; // 元组，位置类型固定

class Dog {
  readonly kind = 'dog';
  bark(): string {
    return '汪';
  }
}
class Cat {
  readonly kind = 'cat';
  meow(): string {
    return '喵';
  }
}
// 最佳公共类型推断：找不到共同父类型时得到联合类型
const pets = [new Dog(), new Cat()]; // (Dog | Cat)[]

function arrayInferenceDemo(): void {
  console.log('\n3) 数组与元组的推断：');
  console.log('   numberList 推断为 number[]：', numberList.length);
  console.log('   mixedList 推断为 (string | number)[]：', JSON.stringify(mixedList));
  console.log('   pairTuple 元组位置固定：', pairTuple[0], pairTuple[1]);

  // 数组下标访问在 noUncheckedIndexedAccess 下推断为 number | undefined
  const first = numberList[0];
  console.log('   下标访问需处理 undefined：', first ?? 'undefined');

  for (const pet of pets) {
    // 联合类型成员都有 kind，仍可直接访问
    console.log('   最佳公共类型成员 kind：', pet.kind);
  }
}

// ============================================================================
// 4. 对象字面量推断
//    - 函数返回对象字面量 → 属性值被拓宽（不保留字面量）
//    - 解构赋值 → 得到属性的类型
//    - 属性缺省 / 多余都会报错，推断结果就是「精确形状」
// ============================================================================
function createUser() {
  // 返回值推断为 { name: string; age: number }
  return { name: 'Tom', age: 18 };
}

function objectInferenceDemo(): void {
  console.log('\n4) 对象字面量推断：');

  const user = createUser();
  // @ts-expect-error 推断出的形状里没有 email 属性（运行时不会执行）
  if (false) console.log('   访问不存在的属性：', user.email);

  const { name, age } = user; // name: string, age: number
  console.log('   解构得到推断类型：', name, age);

  // @ts-expect-error 属性类型为 string，不能赋 number（运行时不会执行）
  if (false) user.name = 123;
}

// ============================================================================
// 5. 函数相关推断
//    - 返回值：有 return 时可自动推断；递归函数必须显式标注
//    - 参数默认值：默认值决定参数类型（也可被显式标注覆盖）
//    - 可选参数：推断为 T | undefined
//    - 参数本身不会自动推断（隐式 any 会报错），需标注或依赖上下文
// ============================================================================
function withDefault(x = 10) {
  return x * 2; // x: number, 返回值 number
}

function withOptional(x?: number) {
  return x ?? 0; // x: number | undefined
}

// 递归函数无法从自身推断返回类型，必须显式标注
function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function functionInferenceDemo(): void {
  console.log('\n5) 函数相关推断：');
  console.log('   默认值推断 withDefault()：', withDefault());
  console.log('   可选参数推断 withOptional(undefined)：', withOptional());
  console.log('   withOptional(5)：', withOptional(5));
  console.log('   递归函数需显式标注 factorial(5)：', factorial(5));
  console.log('   函数本身可被 typeof 取类型：', typeof factorial);
}

// ============================================================================
// 6. 上下文类型推断（contextual typing）
//    - 声明处给了函数类型 / 回调位置有类型时，参数可省略标注
//    - 数组高阶方法的回调参数由数组元素类型推断
// ============================================================================
const formatter: (payload: { id: number; title: string }) => string = (payload) =>
  `#${payload.id} ${payload.title}`; // payload 由上下文推断

function contextualDemo(): void {
  console.log('\n6) 上下文类型推断：');

  console.log('   回调参数自动获得类型：', formatter({ id: 1, title: '任务' }));

  // map 的元素类型来自 numberList，回调参数 n 推断为 number
  const labels = numberList.map((n) => n.toFixed(1));
  console.log('   数组高阶方法推断参数：', labels.join(', '));

  // 对象方法中的 this 由对象字面量上下文推断
  const counter = {
    count: 0,
    increment(step: number): number {
      this.count += step;
      return this.count;
    },
  };
  console.log('   对象方法 this 推断：', counter.increment(2));
}

// ============================================================================
// 7. 泛型推断
//    - 从实参反推类型参数，无需显式 <T>
//    - 多个实参时取「最佳公共类型」
//    - keyof 约束下，K 由 key 实参推断，返回值精确到 T[K]
// ============================================================================
function first<T>(list: readonly T[]): T | undefined {
  return list[0];
}

function merge<T, U>(a: T, b: U): T & U {
  return { ...a, ...b };
}

function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

function genericInferenceDemo(): void {
  console.log('\n7) 泛型推断：');

  const firstNumber = first([10, 20, 30]); // T 推断为 number
  console.log('   从实参推断 T：', firstNumber);

  const merged = merge({ a: 1 }, { b: 'x' }); // T & U
  console.log('   多个实参合成交叉类型：', JSON.stringify(merged));

  const user = { id: 1, name: 'Tom', active: true };
  const nameValue = pluck(user, 'name'); // T[K] 精确为 string
  console.log('   keyof 约束下返回值精确：', nameValue);

  // @ts-expect-error 'notExist' 不在 keyof user 中
  pluck(user, 'notExist');
}

// ============================================================================
// 8. 类型收窄推断
//    - typeof / in / instanceof / Array.isArray / 判别联合 / 真假值
//    - 每个分支里，TS 会把类型推断成更窄的子集
// ============================================================================
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };

function area(shape: Shape): number {
  // 判别联合：根据 kind 自动收窄
  return shape.kind === 'circle' ? Math.PI * shape.radius ** 2 : shape.width * shape.height;
}

function describe(value: string | number | Date): string {
  if (typeof value === 'string') return value.toUpperCase();
  if (typeof value === 'number') return value.toFixed(2);
  return value.toISOString(); // 排除前两者后只剩 Date
}

function assertNever(value: never): never {
  throw new Error(`未处理的分支：${String(value)}`);
}

function narrowingDemo(): void {
  console.log('\n8) 类型收窄推断：');
  console.log('   判别联合收窄 area(circle)：', area({ kind: 'circle', radius: 2 }).toFixed(1));
  console.log('   判别联合收窄 area(rect)：', area({ kind: 'rect', width: 2, height: 3 }));
  console.log('   typeof 收窄 describe("abc")：', describe('abc'));
  console.log('   typeof 收窄 describe(3.14159)：', describe(3.14159));
  console.log('   typeof 收窄 describe(new Date(0))：', describe(new Date(0)));

  // 真假值收窄：可选参数在 if 内变成 string
  function shout(text?: string): string {
    return text ? text.toUpperCase() : '(空)';
  }
  console.log('   真假值收窄 shout("hi")：', shout('hi'));
  console.log('   真假值收窄 shout()：', shout());

  // Array.isArray 收窄
  function total(input: number | number[]): number {
    return Array.isArray(input) ? input.reduce((a, b) => a + b, 0) : input;
  }
  console.log('   Array.isArray 收窄：', total([1, 2, 3]), total(5));

  // 穷尽检查：故意漏掉分支时，assertNever 的参数不是 never 会编译报错
  const exhaustive = (shape: Shape): string =>
    shape.kind === 'circle' ? 'circle' : shape.kind === 'rect' ? 'rect' : assertNever(shape);
  console.log('   穷尽检查：', exhaustive({ kind: 'rect', width: 1, height: 1 }));
}

// ============================================================================
// 9. typeof / 工具类型观察推断结果
//    - typeof 取「值」的类型，再交给工具类型加工
// ============================================================================
function greet(name: string, times: number = 1): string {
  return `Hi ${name}`.repeat(times);
}

function utilityTypeDemo(): void {
  console.log('\n9) typeof 与工具类型：');

  type GreetParams = Parameters<typeof greet>; // [name: string, times?: number]
  const args: GreetParams = ['Tom', 2];
  console.log('   Parameters 由函数推断：', JSON.stringify(args));
  console.log('   ReturnType 由函数推断：', greet(...args));

  type User = ReturnType<typeof createUser>;
  const picked: Pick<User, 'name'> = { name: 'Jerry' };
  console.log('   组合工具类型：', picked.name);
}

// ============================================================================
// 10. satisfies：校验类型的同时保留最精确推断
//     - 用注解会让值被拓宽为注解类型
//     - 用 satisfies 只做校验，推断结果不变
// ============================================================================
type RouteConfig = Record<string, { path: string; auth: boolean }>;

// 注解写法：routesAnnotated.admin.path 变成 string
const routesAnnotated: RouteConfig = {
  home: { path: '/', auth: false },
  admin: { path: '/admin', auth: true },
};

// satisfies + as const：校验结构，同时路径保留字面量类型
const routes = {
  home: { path: '/', auth: false },
  admin: { path: '/admin', auth: true },
} as const satisfies RouteConfig;

function satisfiesDemo(): void {
  console.log('\n10) satisfies 与推断精度：');
  // 注解写法把 path 拓宽成 string（不再是 '/admin' 字面量）
  const annotatedPath: string = routesAnnotated.admin?.path ?? '';
  console.log('   注解写法 path 类型被拓宽：', annotatedPath);
  console.log('   satisfies 保留字面量：', routes.admin.path, routes.admin.auth);

  // @ts-expect-error satisfies 只校验结构，写错键名仍在编译期被拦截（运行时不会执行）
  if (false) console.log(routes.homme.path);
}

// ============================================================================
// 11. 常见坑位
// ============================================================================
function pitfallDemo(): void {
  console.log('\n11) 常见坑位：');

  // 坑 1：空数组字面量推断为 any[]（后续 push 会「进化」元素类型）
  const empty: number[] = []; // 推荐显式标注，避免 any[]
  empty.push(1);
  console.log('   显式标注的空数组避免 any[]：', empty.length);

  // 坑 2：JSON.parse 返回 any，不会自动推断结构
  const parsed = JSON.parse('{"id":1}') as { id: number };
  console.log('   JSON.parse 需自行断言/校验：', parsed.id);

  // 坑 3：无上下文的回调参数是隐式 any（strict 下报错）
  // const bad = list.map((item) => item); // 无 list 类型时 item 为隐式 any

  // 坑 4：对象方法中 this 依赖上下文，抽出来单独调用会丢失 this 类型
  const obj = {
    value: 1,
    read(this: { value: number }): number {
      return this.value;
    },
  };
  const detached = obj.read;
  // @ts-expect-error 脱离对象后无法推断 this，调用需显式绑定（运行时不会执行）
  if (false) detached();
  console.log('   显式 call 绑定后才能调用：', detached.call(obj));
}

// ============================================================================
// 12. 编译期断言：把推断结果写成测试（不符合预期则 tsc 报错）
// ============================================================================
type _CheckConstText = Expect<Equal<typeof constText, 'hello'>>;
type _CheckMutableText = Expect<Equal<typeof mutableText, string>>;
type _CheckNumberList = Expect<Equal<typeof numberList, number[]>>;
type _CheckMixedList = Expect<Equal<typeof mixedList, (string | number)[]>>;
type _CheckFrozenConfig = Expect<
  Equal<typeof frozenConfig, { readonly host: 'localhost'; readonly port: 3000 }>
>;
type _CheckCreateUser = Expect<Equal<ReturnType<typeof createUser>, { name: string; age: number }>>;
type _CheckGreet = Expect<Equal<typeof greet, (name: string, times?: number) => string>>;
type _CheckPluck = Expect<Equal<ReturnType<typeof pluck<{ a: string }, 'a'>>, string>>;

function compileTimeAssertDemo(): void {
  // 收集断言：任意一条推断不符合预期，tsc 都会在编译期报错
  const checks: true[] = [
    true as _CheckConstText,
    true as _CheckMutableText,
    true as _CheckNumberList,
    true as _CheckMixedList,
    true as _CheckFrozenConfig,
    true as _CheckCreateUser,
    true as _CheckGreet,
    true as _CheckPluck,
  ];
  console.log('\n12) 编译期断言：');
  console.log('   Equal 断言通过数：', checks.length);
}

// ============================================================================
// 主程序
// ============================================================================
function main(): void {
  basicInferenceDemo();
  asConstDemo();
  arrayInferenceDemo();
  objectInferenceDemo();
  functionInferenceDemo();
  contextualDemo();
  genericInferenceDemo();
  narrowingDemo();
  utilityTypeDemo();
  satisfiesDemo();
  pitfallDemo();
  compileTimeAssertDemo();
}

main();
