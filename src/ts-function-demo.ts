/**
 * ============================================================================
 * TypeScript 函数用法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-function-demo.ts
 *
 * 覆盖：
 *   1. 函数声明 / 函数表达式 / 箭头函数
 *   2. 参数形态：可选、默认值、剩余参数、解构
 *   3. 函数类型与高阶函数（回调、返回函数、柯里化）
 *   4. this 参数与 call / apply / bind
 *   5. 函数重载
 *   6. 泛型函数（约束、默认类型参数、keyof）
 *   7. 类型谓词 is 与断言函数 asserts
 *   8. 函数类型工具：Parameters / ReturnType / Awaited
 *   9. 异步函数
 *  10. 常见坑位
 * ============================================================================
 */

// ============================================================================
// 1. 三种定义函数的方式
// ============================================================================
function declarationStyle(name: string): string {
  return `Hello, ${name}`;
}

const expressionStyle = function (name: string): string {
  return `Hello, ${name}`;
};

const arrowStyle = (name: string): string => `Hello, ${name}`;

function definitionStyleDemo(): void {
  console.log('1) 三种定义方式：');
  console.log('   function 声明：', declarationStyle('A'));
  console.log('   function 表达式：', expressionStyle('B'));
  console.log('   箭头函数：', arrowStyle('C'));
  // 函数声明有提升（hoisting），表达式与箭头函数没有
  console.log('   函数也是对象，typeof：', typeof declarationStyle);
}

// ============================================================================
// 2. 参数形态
// ============================================================================
// 可选参数必须放在必需参数之后；默认参数同时也是可选的
function buildName(first: string, last?: string, title: string = 'Mr.'): string {
  return `${title} ${first}${last ? ` ${last}` : ''}`;
}

// 剩余参数收集为数组，必须位于参数列表末尾
function sumAll(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

interface Options {
  url: string;
  method?: string;
  retries?: number;
}

// 解构参数 + 默认值：调用方无需关心参数顺序
function request({ url, method = 'GET', retries = 1 }: Options): string {
  return `${method} ${url} (retry=${retries})`;
}

function paramsDemo(): void {
  console.log('\n2) 参数形态：');
  console.log('   可选参数 buildName("Tom")：', buildName('Tom'));
  console.log('   默认参数 buildName("Tom", "Lee", "Dr.")：', buildName('Tom', 'Lee', 'Dr.'));
  console.log('   剩余参数 sumAll(1,2,3,4)：', sumAll(1, 2, 3, 4));
  console.log('   解构参数 request({url})：', request({ url: '/api/user' }));
  console.log('   解构参数 request({url, method})：', request({ url: '/api/user', method: 'POST' }));
}

// ============================================================================
// 3. 函数类型与高阶函数
// ============================================================================
// 用 type 描述函数签名（也可以用 interface 的 call signature）
type BinaryOp = (a: number, b: number) => number;

const add: BinaryOp = (a, b) => a + b;
const multiply: BinaryOp = (a, b) => a * b;

// 接收函数作为参数
function compute(a: number, b: number, op: BinaryOp): number {
  return op(a, b);
}

// 返回一个函数（闭包）
function createMultiplier(factor: number): (n: number) => number {
  return (n) => n * factor;
}

// 柯里化：把多参数函数拆成逐个接收的形式
const addCurried: (a: number) => (b: number) => number = (a) => (b) => a + b;

function higherOrderDemo(): void {
  console.log('\n3) 函数类型与高阶函数：');
  console.log('   回调 compute(6, 7, add)：', compute(6, 7, add));
  console.log('   回调 compute(6, 7, multiply)：', compute(6, 7, multiply));

  const triple = createMultiplier(3);
  console.log('   返回函数 triple(5)：', triple(5));

  console.log('   柯里化 addCurried(1)(2)：', addCurried(1)(2));
  console.log('   函数作为值：', [add, multiply].map((op) => op(2, 3)).join(' / '));
}

// ============================================================================
// 4. this 参数与 call / apply / bind
// ============================================================================
interface Person {
  name: string;
}

// 显式声明 this 类型：strict 模式下避免隐式 any 报错
function greetWith(this: Person, greeting: string): string {
  return `${greeting}, ${this.name}`;
}

function thisDemo(): void {
  console.log('\n4) this 参数与调用方式：');
  const ctx: Person = { name: 'Tom' };

  console.log('   call：', greetWith.call(ctx, 'Hi'));
  console.log('   apply：', greetWith.apply(ctx, ['Hello']));

  const bound = greetWith.bind(ctx, 'Hey');
  console.log('   bind：', bound());
}

// ============================================================================
// 5. 函数重载
//    - 上方多个重载签名对外可见，实现签名对外不可见
//    - 实现签名必须兼容所有重载签名
// ============================================================================
function toLabel(value: string): string;
function toLabel(value: number): string;
function toLabel(value: string | number): string {
  return typeof value === 'string' ? `文字:${value}` : `数字:${value.toFixed(2)}`;
}

// 重载 + 可选参数组合
function findElement(id: number): string | undefined;
function findElement(id: number, fallback: string): string;
function findElement(id: number, fallback?: string): string | undefined {
  return id === 1 ? 'item-1' : fallback;
}

function overloadDemo(): void {
  console.log('\n5) 函数重载：');
  console.log('   toLabel("a")：', toLabel('a'));
  console.log('   toLabel(3.14159)：', toLabel(3.14159));
  console.log('   findElement(1)：', findElement(1));
  console.log('   findElement(2, "default")：', findElement(2, 'default'));
}

// ============================================================================
// 6. 泛型函数
// ============================================================================
// 基础泛型：入参与返回值保持同一类型
function identity<T>(value: T): T {
  return value;
}

// 约束：T 必须带有 length 属性
function logLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

// keyof 约束：key 必须是 obj 的已有键，返回值类型自动推导
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 默认类型参数：调用时省略则使用默认
function pair<T, U = T>(first: T, second: U): [T, U] {
  return [first, second];
}

function genericDemo(): void {
  console.log('\n6) 泛型函数：');
  console.log('   identity<number>(5)：', identity<number>(5));
  console.log('   identity 类型推断：', identity('自动推断为 string'));
  console.log('   logLength("hello")：', logLength('hello'));
  console.log('   logLength([1,2,3])：', logLength([1, 2, 3]));

  const user = { id: 1, name: 'Tom', active: true };
  console.log('   pluck(user, "name")：', pluck(user, 'name'));

  console.log('   pair(1, "a")：', JSON.stringify(pair(1, 'a')));
  console.log('   pair(1, 2)（U 默认取 T）：', JSON.stringify(pair(1, 2)));
}

// ============================================================================
// 7. 类型谓词 is 与断言函数 asserts
// ============================================================================
type Pet = { kind: 'cat'; meow: () => string } | { kind: 'dog'; bark: () => string };

// 类型谓词：返回 true 时，TS 会把入参收窄成 Fish
function isCat(pet: Pet): pet is Extract<Pet, { kind: 'cat' }> {
  return pet.kind === 'cat';
}

// 断言函数：函数正常返回即代表条件成立，之后类型被收窄
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`期望 string，实际是 ${typeof value}`);
  }
}

function predicateDemo(): void {
  console.log('\n7) 类型谓词与断言函数：');

  const pets: Pet[] = [
    { kind: 'cat', meow: () => '喵' },
    { kind: 'dog', bark: () => '汪' },
  ];
  for (const pet of pets) {
    console.log('   类型收窄：', isCat(pet) ? pet.meow() : pet.bark());
  }

  const raw: unknown = '已确认是字符串';
  assertIsString(raw);
  // 此处 raw 已被收窄为 string，可直接使用字符串方法
  console.log('   断言函数后可用 toUpperCase：', raw.toUpperCase());

  try {
    assertIsString(42);
  } catch (e) {
    console.log('   断言失败：', (e as Error).message);
  }
}

// ============================================================================
// 8. 函数类型工具
// ============================================================================
function formatUser(name: string, age: number): { label: string } {
  return { label: `${name}(${age})` };
}

async function fetchScore(id: number): Promise<number> {
  return id * 10;
}

function utilityTypesDemo(): void {
  console.log('\n8) 函数类型工具：');

  // Parameters：取参数元组
  type FormatArgs = Parameters<typeof formatUser>;
  const args: FormatArgs = ['Tom', 18];
  console.log('   Parameters 得到元组：', JSON.stringify(args));

  // ReturnType：取返回值类型
  type FormatResult = ReturnType<typeof formatUser>;
  const result: FormatResult = formatUser(...args);
  console.log('   ReturnType 使用：', result.label);

  // Awaited / ReturnType 组合：取 async 函数解析后的类型
  type Score = Awaited<ReturnType<typeof fetchScore>>;
  const score: Score = 100;
  console.log('   Awaited<ReturnType<...>>：', score);
}

// ============================================================================
// 9. 异步函数
// ============================================================================
async function stepOne(): Promise<string> {
  return 'step-1';
}

// async 函数返回 Promise；await 解包后类型自动推导
async function asyncFlowDemo(): Promise<void> {
  console.log('\n9) 异步函数：');

  const first = await stepOne();
  console.log('   await 结果：', first);
  console.log('   非 await 时是 Promise：', stepOne() instanceof Promise);

  try {
    await Promise.reject(new Error('模拟失败'));
  } catch (e) {
    console.log('   async 内的 try/catch：', (e as Error).message);
  }
}

// ============================================================================
// 10. 常见坑位
// ============================================================================
function pitfallDemo(): void {
  console.log('\n10) 常见坑位：');

  // 坑 1：可选参数不能放在必需参数之前（编译期报错）
  // function bad(a?: number, b: number) {}

  // 坑 2：重载实现签名不对外暴露，调用方只能看到重载签名
  // toLabel(true) 会报错：boolean 不匹配任何重载签名

  // 坑 3：void 返回类型允许「有返回值」的函数赋值，返回值会被忽略
  type Callback = () => void;
  const cb: Callback = () => 42; // 合法：返回值被忽略
  console.log('   返回值被忽略的 void 回调：', cb());

  // 坑 4：函数参数按逆变检查——参数更「宽」的函数可以赋给参数更「窄」的类型
  type MouseLike = { type: 'click'; x: number; y: number };
  type EventLike = { type: string };
  type MouseHandler = (e: MouseLike) => void;

  const wideHandler: (e: EventLike) => void = (e) => console.log('   收到事件：', e.type);
  const narrow: MouseHandler = wideHandler; // 合法：EventLike 覆盖 MouseLike
  narrow({ type: 'click', x: 1, y: 2 });
}

// ============================================================================
// 主程序
// ============================================================================
async function main(): Promise<void> {
  definitionStyleDemo();
  paramsDemo();
  higherOrderDemo();
  thisDemo();
  overloadDemo();
  genericDemo();
  predicateDemo();
  utilityTypesDemo();
  await asyncFlowDemo();
  pitfallDemo();
}

void main();
