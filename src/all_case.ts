/**
 * 123
 * 1123
 * 1234
 * 修改代码
 * ============================================================================
 * TypeScript 核心语法演示（单文件 / 纯 Node 可运行）
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-core-syntax-demo.ts
 *
 * 目录：
 *   1.  基础类型与类型推断
 *   2.  数组、元组与只读数组
 *   3.  枚举与 as const
 *   4.  函数（可选参数 / 默认值 / 剩余参数 / 重载）
 *   5.  interface 与 type 的区别
 *   6.  联合类型、交叉类型与类型收窄
 *   7.  类（访问修饰符 / 抽象类 / 实现接口 / getter）
 *   8.  泛型（约束 / 默认类型参数 / 泛型类）
 *   9.  类型守卫与类型断言
 *   10. 工具类型与 keyof / typeof
 *   11. 条件类型、映射类型与模板字面量类型
 *   12. 异步编程：Promise / async-await
 *   13. 可选链、空值合并与非空断言
 * ============================================================================
 */

// ============================================================================
// 1. 基础类型与类型推断
// ============================================================================
// TS 在 JS 之上增加了静态类型系统，编译期即可发现类型错误。

let username: string = 'Alice'; // 字符串
let count: number = 25; // 数字（整数与浮点数统一为 number）
let enabled: boolean = true; // 布尔值
let nothing: null = null; // null
let notSet: undefined = undefined; // undefined

// --- 类型推断：不写注解时 TS 会自动推断 ---
const inferred = 'hello'; // 推断为字面量类型 'hello'（const）
let inferredLet = 'hello'; // 推断为 string（let 可被重新赋值）

// --- void：无返回值；never：永远不会正常返回 ---
function logMessage(msg: string): void {
  console.log(`[log] ${msg}`);
}

function throwError(msg: string): never {
  throw new Error(msg);
}

// --- unknown 比 any 安全：使用前必须先收窄类型 ---
let payload: unknown = '{"id":1}';
if (typeof payload === 'string') {
  console.log(`unknown 收窄后长度：${payload.length}`);
}

// ============================================================================
// 2. 数组、元组与只读数组
// ============================================================================
const numbers: number[] = [1, 2, 3]; // 推荐写法
const names: Array<string> = ['a', 'b']; // 等价泛型写法

// 元组：长度与每个位置的类型都固定
const userTuple: [number, string, boolean] = [1, 'Alice', true];
const [userId, userName] = userTuple; // 解构后自动获得对应类型

// 只读数组：编译期禁止 push / 下标赋值
const readonlyNumbers: readonly number[] = [1, 2, 3];

// 注意：项目开启了 noUncheckedIndexedAccess，下标访问结果可能为 undefined
const first = readonlyNumbers[0] ?? 0;

// ============================================================================
// 3. 枚举与 as const
// ============================================================================
enum OrderStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Cancelled = 'CANCELLED',
}

/** 用 as const 定义常量对象，效果接近枚举且产物更小 */
const HttpCode = {
  Ok: 200,
  NotFound: 404,
} as const;
type HttpCode = (typeof HttpCode)[keyof typeof HttpCode];

// ============================================================================
// 4. 函数（可选参数 / 默认值 / 剩余参数 / 重载）
// ============================================================================
/** 可选参数（?）必须位于必选参数之后 */
function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : name;
}

/** 默认参数 */
function paginate(page: number = 1, size: number = 10): { offset: number; limit: number } {
  return { offset: (page - 1) * size, limit: size };
}

/** 剩余参数：类型为数组 */
function sum(...nums: number[]): number {
  return nums.reduce((acc, cur) => acc + cur, 0);
}

/** 函数重载：先声明签名，再给实现签名 */
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  return typeof value === 'number' ? value.toFixed(2) : value.trim();
}

// ============================================================================
// 5. interface 与 type 的区别
// ============================================================================
/** interface：可声明合并、适合描述对象结构 */
interface User {
  readonly id: number; // 只读属性
  name: string;
  age?: number; // 可选属性
}

interface User {
  email?: string; // ✅ 声明合并：与上面的 User 自动合并
}

/** type：可定义联合、元组、条件类型等，不能被合并 */
type UserId = number | string;
type UserWithRole = User & { role: 'admin' | 'guest' };

// ============================================================================
// 6. 联合类型、交叉类型与类型收窄
// ============================================================================
type Result<T> = { success: true; data: T } | { success: false; message: string };

/** 通过判别属性（success）自动收窄联合类型 */
function unwrap<T>(result: Result<T>): T | null {
  if (result.success) {
    return result.data; // 此处收窄为 { success: true; data: T }
  }
  logMessage(`调用失败：${result.message}`); // 收窄为 { success: false; message: string }
  return null;
}

// ============================================================================
// 7. 类（访问修饰符 / 抽象类 / 实现接口 / getter）
// ============================================================================
abstract class Repository<T extends { id: number }> {
  protected readonly store = new Map<number, T>();

  abstract validate(entity: T): void;

  save(entity: T): void {
    this.validate(entity);
    this.store.set(entity.id, entity);
  }

  findById(id: number): T | undefined {
    return this.store.get(id);
  }

  get size(): number {
    return this.store.size; // getter 以属性方式访问
  }
}

interface Auditable {
  createdAt: Date;
}

class UserRepository extends Repository<User> implements Auditable {
  createdAt = new Date();

  // 参数属性：在构造函数参数上直接声明访问修饰符
  constructor(private readonly logger: (msg: string) => void) {
    super();
  }

  validate(entity: User): void {
    if (!entity.name) {
      throwError('name 不能为空');
    }
    this.logger(`校验通过：${entity.name}`);
  }
}

// ============================================================================
// 8. 泛型（约束 / 默认类型参数 / 泛型类）
// ============================================================================
/** 泛型约束：T 必须包含 id 字段 */
function pickById<T extends { id: number }>(list: T[], id: number): T | undefined {
  return list.find((item) => item.id === id);
}

/** 默认类型参数 + 泛型约束组合 */
interface PageResult<T = unknown> {
  total: number;
  list: T[];
}

/** 泛型工具函数：安全读取对象属性 */
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ============================================================================
// 9. 类型守卫与类型断言
// ============================================================================
/** 自定义类型守卫：返回值为 `x is T`，调用处可自动收窄 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** in 操作符收窄 */
type Cat = { meow: () => void };
type Dog = { bark: () => void };
function makeSound(animal: Cat | Dog): void {
  if ('meow' in animal) {
    animal.meow();
  } else {
    animal.bark();
  }
}

/** 类型断言：当 TS 无法推断但开发者百分百确定时使用 */
const rawValue: unknown = [1, 2, 3];
const assertedLength = (rawValue as number[]).length;

// ============================================================================
// 10. 工具类型与 keyof / typeof
// ============================================================================
type UserKey = keyof User; // 'id' | 'name' | 'age' | 'email'
type PartialUser = Partial<User>; // 全部可选
type RequiredUser = Required<User>; // 全部必填
type UserPreview = Pick<User, 'id' | 'name'>; // 挑选字段
type UserWithoutAge = Omit<User, 'age'>; // 排除字段
type UserRecord = Record<UserKey, string>; // 键值映射
type ImmutableUser = Readonly<User>; // 只读
type OnlyString = Extract<'a' | 1 | 'b' | 2, string>; // 'a' | 'b'
type WithoutString = Exclude<'a' | 1 | 'b' | 2, string>; // 1 | 2

// ============================================================================
// 11. 条件类型、映射类型与模板字面量类型
// ============================================================================
/** 条件类型：根据输入类型返回不同类型 */
type IsArray<T> = T extends unknown[] ? true : false;
type ApiResponse<T> = T extends string ? { text: T } : { json: T };

/** 映射类型：把任意类型的属性统一处理 */
type Nullable<T> = { [K in keyof T]: T[K] | null };

/** 模板字面量类型：拼装字符串类型 */
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>; // 'onClick'

// 增强 + 只读的映射类型（保留修饰符）
type DeepReadonly<T> = { readonly [K in keyof T]: T[K] };

// ============================================================================
// 12. 异步编程：Promise / async-await
// ============================================================================
interface RemoteUser {
  id: number;
  name: string;
}

/** 模拟远程查询，返回 Promise<T> */
function fetchUser(id: number): Promise<RemoteUser> {
  return Promise.resolve({ id, name: `user-${id}` });
}

/** 异步函数返回值类型始终是 Promise<T> */
async function fetchUsers(ids: number[]): Promise<RemoteUser[]> {
  return Promise.all(ids.map((id) => fetchUser(id)));
}

/** 带超时保护的异步封装：演示 Promise.race 与错误处理 */
async function fetchWithTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`请求超时：${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([task, timeout]);
}

// ============================================================================
// 13. 可选链、空值合并与非空断言
// ============================================================================
interface Order {
  id: number;
  buyer?: User;
}

function describeOrder(order: Order): string {
  // ?. 安全访问，?? 提供默认值
  const buyerName = order.buyer?.name ?? '匿名用户';
  return `订单 ${order.id} 的下单人：${buyerName}`;
}

// ============================================================================
// 运行验证
// ============================================================================
function main(): void {
  console.log('=== TypeScript 核心语法演示 ===\n');

  // 1~3
  console.log('1) 基础类型：', { username, count, enabled, nothing, notSet, inferred, inferredLet });
  console.log('2) 数组/元组/只读：', { numbers, names, userId, userName, first });
  console.log('3) 枚举/as const：', OrderStatus.Paid, HttpCode.NotFound);

  // 4
  console.log('4) 函数：', greet('Alice', 'Ms.'), paginate(3, 20), sum(1, 2, 3, 4), format(3.14159));

  // 5~6
  const user: User = { id: 1, name: 'Alice', age: 25, email: 'alice@example.com' };
  const okResult: Result<RemoteUser> = { success: true, data: { id: 1, name: 'Alice' } };
  console.log('5~6) interface/联合类型：', user, unwrap(okResult));

  // 7
  const repo = new UserRepository((msg) => logMessage(msg));
  repo.save(user);
  console.log('7) 类/泛型仓储：', { size: repo.size, found: repo.findById(1)?.name });

  // 8
  console.log('8) 泛型：', pickById([user], 1)?.name, getProperty(user, 'name'));
  const page: PageResult<User> = { total: 1, list: [user] };
  console.log('8) 泛型分页返回：', page.total, page.list.length);

  // 9
  console.log('9) 类型守卫/断言：', isStringArray(['a', 'b']), assertedLength);
  makeSound({ meow: () => console.log('  喵') });

  // 10~11（类型层面演示，运行时仅打印占位说明）
  const preview: UserPreview = { id: user.id, name: user.name };
  const nullableUser: Nullable<UserPreview> = { id: 1, name: null };
  const clickEvent: ClickEvent = 'onClick';
  const isArrayFlag: IsArray<number[]> = true;
  const stringResponse: ApiResponse<string> = { text: 'ok' };
  console.log('10) 工具类型：', preview, nullableUser);
  console.log('11) 条件/模板字面量类型：', { clickEvent, isArrayFlag, stringResponse });

  // 12~13
  void (async () => {
    const users = await fetchUsers([1, 2]);
    const fast = await fetchWithTimeout(fetchUser(9), 1000);
    console.log('12) 异步：', users.map((item) => item.name), fast);
    console.log('13) 可选链：', describeOrder({ id: 1001 }), describeOrder({ id: 1002, buyer: user }));
    console.log('\n=== 演示结束 ===');
  })();
}

main();
