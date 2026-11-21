/**
 * ============================================================================
 * TypeScript "?" 语法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-question-mark-syntax-demo.ts
 *
 * 覆盖清单：
 *   1. 可选属性（interface / type / class）
 *   2. 可选函数参数
 *   3. 可选链操作符 ?.
 *   4. 空值合并运算符 ?? 与 ??=
 *   5. 条件类型 T extends U ? X : Y
 *   6. 可选元组成员 [T?]
 *   7. 带标签的可选元组成员
 * ============================================================================
 */

// ============================================================================
// 1. 可选属性（Optional Properties）
// ============================================================================
// 在 interface / type / class 中用 "?:" 声明属性可有可无。

interface UserProfile {
  id: number;
  name: string;
  // 可选属性
  age?: number;
  email?: string;
}

type Product = {
  sku: string;
  price: number;
  // 可选属性
  description?: string;
  tags?: string[];
};

class Config {
  // 类中的可选属性
  timeout?: number;
  retries?: number;

  constructor(public baseUrl: string) {}
}

const user1: UserProfile = { id: 1, name: 'Alice' };
const user2: UserProfile = { id: 2, name: 'Bob', age: 30, email: 'bob@example.com' };
const product: Product = { sku: 'BOOK-001', price: 59 };
const cfg = new Config('https://api.example.com');

// ============================================================================
// 2. 可选函数参数（Optional Parameters）
// ============================================================================
// 函数参数后加 "?:" 表示调用时可省略，必须放在必选参数之后。

function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : name;
}

function buildUrl(path: string, base?: string, query?: Record<string, string>): string {
  let url = base ?? 'https://default.example.com';
  url += path;
  if (query) {
    const params = new URLSearchParams(query).toString();
    if (params) url += `?${params}`;
  }
  return url;
}

// 默认值与可选参数的区别：默认值在调用处仍可省略，但函数体内有确定值。
function paginate(page = 1, size?: number): { page: number; size: number } {
  return { page, size: size ?? 10 };
}

// ============================================================================
// 3. 可选链操作符 ?.
// ============================================================================
// 当左侧可能是 null / undefined 时，安全地访问属性、调用方法或访问索引。

interface Company {
  name: string;
  address?: {
    city?: string;
    street?: string;
  };
  departments?: string[];
  getLogo?: () => string;
}

function describeCompany(c: Company | null | undefined): string {
  // 访问深层可选属性
  const city = c?.address?.city ?? '未知城市';
  // 调用可选方法
  const logo = c?.getLogo?.() ?? '默认 Logo';
  // 访问可选数组元素
  const firstDept = c?.departments?.[0] ?? '无部门';

  return `${c?.name ?? '未知公司'} | ${city} | ${logo} | ${firstDept}`;
}

// ============================================================================
// 4. 空值合并运算符 ?? 与 ??=
// ============================================================================
// ?? 只在左侧为 null 或 undefined 时返回右侧；??= 是其赋值简写。

function withDefault<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

function updateConfig(options: { timeout?: number; retries?: number }): Config {
  const c = new Config('https://api.example.com');
  // ??= 仅在 c.timeout 为 null/undefined 时赋值
  c.timeout ??= options.timeout ?? 5000;
  c.retries ??= options.retries ?? 3;
  return c;
}

// 注意：?? 与 || 不同；0、''、false 会被 || 跳过，但不会被 ?? 跳过。
const zero = 0;
console.log('|| 结果：', zero || 100); // 100
console.log('?? 结果：', zero ?? 100); // 0

// ============================================================================
// 5. 条件类型（Conditional Types）
// ============================================================================
// 类型层面的三目运算：T extends U ? X : Y

type IsString<T> = T extends string ? true : false;

type MessageOf<T> = T extends { message: infer M } ? M : never;

interface EmailMessage {
  message: string;
}

interface ErrorMessage {
  message: string;
  code: number;
}

type EmailContent = MessageOf<EmailMessage>; // string
type ErrorContent = MessageOf<ErrorMessage>; // string

// 分发条件类型：裸类型参数会按联合成员逐一判断。
type ToArray<T> = T extends unknown ? T[] : never;
type StrOrNumArray = ToArray<string | number>; // string[] | number[]

// ============================================================================
// 6. 可选元组成员（Optional Tuple Elements）
// ============================================================================
// 元组元素后加 "?:" 表示该位置可省略。

type Point2D = [number, number];
type Point3D = [number, number, number?];

const p2: Point2D = [1, 2];
const p3a: Point3D = [1, 2];
const p3b: Point3D = [1, 2, 3];

function drawPoint(point: Point3D): void {
  const [x, y, z] = point;
  console.log(`x=${x}, y=${y}, z=${z ?? '未指定'}`);
}

// ============================================================================
// 7. 带标签的可选元组成员（Labeled Optional Tuple Elements）
// ============================================================================
// 元组元素可以带标签，标签后仍可加 "?:" 表示可选。

type PersonTuple = [name: string, age?: number, vip?: boolean];

const personA: PersonTuple = ['Alice'];
const personB: PersonTuple = ['Bob', 25];
const personC: PersonTuple = ['Carol', 30, true];

function printPerson([name, age, vip]: PersonTuple): string {
  return `${name}, age=${age ?? '保密'}, vip=${vip ?? false}`;
}

// ============================================================================
// 运行验证
// ============================================================================
function main(): void {
  console.log('=== TypeScript "?" 语法全演示 ===\n');

  // 1. 可选属性
  console.log('1) 可选属性：', user1, user2, product, { timeout: cfg.timeout, retries: cfg.retries });

  // 2. 可选参数
  console.log('2) 可选参数：', greet('Alice'), greet('Bob', 'Dr.'));
  console.log('   buildUrl：', buildUrl('/users'), buildUrl('/users', 'https://api.example.com', { page: '1' }));
  console.log('   paginate：', paginate(), paginate(2), paginate(3, 50));

  // 3. 可选链
  const fullCompany: Company = {
    name: 'Acme',
    address: { city: 'Shanghai' },
    departments: ['Engineering', 'Product'],
    getLogo: () => 'acme-logo.png',
  };
  console.log('3) 可选链：', describeCompany(fullCompany));
  console.log('   空对象：', describeCompany({ name: 'Empty' }));
  console.log('   null：', describeCompany(null));

  // 4. 空值合并
  console.log('4) 空值合并：', withDefault(null, 'fallback'), withDefault(undefined, 42), withDefault('hello', 'fallback'));
  console.log('   ??= 赋值：', updateConfig({ timeout: 1000 }), updateConfig({}));

  // 5. 条件类型（类型层面，运行时仅打印说明）
  const isStrTrue: IsString<'hello'> = true;
  const isStrFalse: IsString<123> = false;
  const arr: StrOrNumArray = ['a', 'b'];
  console.log('5) 条件类型：', { isStrTrue, isStrFalse, arr });

  // 6. 可选元组
  console.log('6) 可选元组：');
  drawPoint(p2);
  drawPoint(p3a);
  drawPoint(p3b);

  // 7. 带标签可选元组
  console.log('7) 带标签可选元组：');
  console.log('  ', printPerson(personA));
  console.log('  ', printPerson(personB));
  console.log('  ', printPerson(personC));

  console.log('\n=== 演示结束 ===');
}

main();
