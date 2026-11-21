/**
 * ============================================================================
 * TypeScript 核心语法速查手册
 * ============================================================================
 *
 * 覆盖日常开发中 95% 的 TS 使用场景，每个知识点都带有可运行的示例代码。
 * 建议配合 TS Playground (https://www.typescriptlang.org/play) 边看边练。
 *
 * 目录：
 *   1.  基础类型
 *   2.  数组与元组
 *   3.  枚举 (enum)
 *   4.  函数
 *   5.  对象与解构
 *   6.  接口 (interface)
 *   7.  类型别名 (type)
 *   8.  联合类型与交叉类型
 *   9.  字面量类型与类型收窄
 *   10. 类 (class)
 *   11. 泛型 (generics)
 *   12. 类型断言与类型守卫
 *   13. 工具类型 (utility types)
 *   14. 条件类型与映射类型
 *   15. 模板字面量类型
 *   16. 索引签名与 keyof / typeof
 *   17. 异步编程 (Promise / async-await)
 *   18. 模块系统 (import / export)
 *   19. 声明合并与扩展
 *   20. 实用技巧与最佳实践
 * ============================================================================
 */


// ============================================================================
// 1. 基础类型
// ============================================================================
// TS 在 JS 基础上增加了静态类型系统，编译时即可发现类型错误。

// --- 基本类型注解 ---
let name: string = 'Alice';           // 字符串
let age: number = 25;                 // 数字（整数、浮点数通用 number）
let isActive: boolean = true;         // 布尔值
let nothing: null = null;             // null
let undef: undefined = undefined;     // undefined

// --- void：表示没有返回值 ---
function logMessage(msg: string): void {
  console.log(msg);
  // 没有 return，返回类型为 void
}

// --- never：表示永远不会返回（如抛异常、死循环） ---
function throwError(msg: string): never {
  throw new Error(msg);
}

// --- any：任意类型（尽量避免使用，会关闭类型检查） ---
let anything: any = 'hello';
anything = 123;        // 不报错
anything = { a: 1 };   // 不报错

// --- unknown：类型安全的 any（使用前必须收窄类型） ---
let something: unknown = 'hello';
// something.toUpperCase();  // ❌ 编译报错，unknown 不能直接使用
if (typeof something === 'string') {
  something.toUpperCase();  // ✅ 收窄后可以安全使用
}

// --- 可选链操作符 ?. ---
interface UserAddress {
  address?: {
    city?: string;
  };
}
const userAddr: UserAddress = {};
const city = userAddr?.address?.city;  // 安全访问深层属性，不存在时返回 undefined 而非报错


// ============================================================================
// 2. 数组与元组
// ============================================================================

// --- 数组的两种写法 ---
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ['a', 'b', 'c'];  // 泛型写法，效果相同

// --- 只读数组（禁止修改） ---
const readonlyArr: readonly number[] = [1, 2, 3];
// readonlyArr.push(4);  // ❌ 编译报错，只读数组不能修改

// --- 元组 (tuple)：固定长度、每个位置有确定类型的数组 ---
let tuplePair: [string, number] = ['age', 25];
// let bad: [string, number] = [25, 'age'];  // ❌ 类型顺序必须匹配

// 带标签的元组（TS 4.0+），增强可读性
let person: [name: string, age: number] = ['Bob', 30];

// --- 可选元组元素 ---
let optional: [string, number?] = ['only-name'];  // 第二个元素可选


// ============================================================================
// 3. 枚举 (enum)
// ============================================================================

// --- 数字枚举：默认从 0 开始递增 ---
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right,   // 3
}
let dir: Direction = Direction.Up;

// --- 带初始值的数字枚举 ---
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  ServerError = 500,
}

// --- 字符串枚举：每个成员必须显式赋值 ---
enum ColorEnum {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}

// --- 常量枚举 (const enum)：编译时内联，不生成对象，性能更好 ---
const enum LogLevel {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
}
const level = LogLevel.Info;  // 编译后直接变成 'INFO'

// 💡 日常建议：优先用 union type 代替 enum，更简洁且支持 tree-shaking
type Status = 'pending' | 'running' | 'done' | 'error';
const taskStatus: Status = 'running';


// ============================================================================
// 4. 函数
// ============================================================================

// --- 基础函数类型注解 ---
function add(a: number, b: number): number {
  return a + b;
}

// --- 箭头函数 ---
const multiply = (a: number, b: number): number => a * b;

// --- 可选参数（用 ? 标记）和默认参数 ---
function greet(name: string, greeting: string = 'Hello', suffix?: string): string {
  return `${greeting}, ${name}${suffix ?? '!'}`;
}
greet('Alice');                    // "Hello, Alice!"
greet('Bob', 'Hi');                // "Hi, Bob!"
greet('Charlie', 'Hey', '!!!');    // "Hey, Charlie!!!"

// --- 剩余参数 (rest parameters) ---
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4);  // 10

// --- 函数重载：同一函数根据参数类型有不同行为 ---
function format(value: string): string;
function format(value: number): string;
function format(value: boolean): string;
function format(value: string | number | boolean): string {
  if (typeof value === 'string') return `String: ${value}`;
  if (typeof value === 'number') return `Number: ${value.toFixed(2)}`;
  return `Boolean: ${value ? 'Yes' : 'No'}`;
}
format('hello');  // "String: hello"
format(3.14);     // "Number: 3.14"
format(true);     // "Boolean: Yes"

// --- 回调函数类型 ---
type Callback = (error: Error | null, data?: string) => void;

function fetchData(url: string, callback: Callback): void {
  // 模拟异步请求
  setTimeout(() => {
    callback(null, 'data from ' + url);
  }, 1000);
}

// --- this 参数类型（约束 this 指向） ---
interface EventEmitter {
  on(event: string, listener: (this: EventEmitter, ...args: unknown[]) => void): void;
}


// ============================================================================
// 5. 对象与解构
// ============================================================================

// --- 对象类型注解 ---
const point: { x: number; y: number } = { x: 10, y: 20 };

// --- 解构赋值 + 类型 ---
const { x, y } = point;

// --- 展开运算符 ---
const extendedPoint = { ...point, z: 30 };  // { x: 10, y: 20, z: 30 }

// --- 对象解构 + 重命名 + 默认值 ---
interface ServerConfig {
  host: string;
  port: number;
  timeout?: number;
}
const serverConfig: ServerConfig = { host: 'localhost', port: 3000 };
const { host: serverHost, port: serverPort, timeout = 5000 } = serverConfig;
// serverHost = 'localhost', serverPort = 3000, timeout = 5000


// ============================================================================
// 6. 接口 (interface)
// ============================================================================

// --- 基础接口：描述对象的形状 ---
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;           // 可选属性
  readonly createdAt: string;  // 只读属性，初始化后不可修改
}

const alice: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2024-01-01',
};
// alice.createdAt = '2025-01-01';  // ❌ 只读属性不可修改

// --- 接口继承 ---
interface Animal {
  name: string;
  sound(): void;
}

interface Dog extends Animal {
  breed: string;
}

const myDog: Dog = {
  name: 'Buddy',
  breed: 'Golden Retriever',
  sound() { console.log('Woof!'); },
};

// --- 多继承 ---
interface Printable {
  print(): void;
}
interface Serializable {
  serialize(): string;
}
interface Document extends Printable, Serializable {
  title: string;
}

// --- 接口定义函数类型 ---
interface MathOperation {
  (a: number, b: number): number;
}
const subtract: MathOperation = (a, b) => a - b;

// --- 索引签名：描述"字典"类型 ---
interface StringMap {
  [key: string]: string;  // 任意字符串键，值为 string
}
const map: StringMap = { hello: 'world', foo: 'bar' };

// --- 接口合并（声明合并）：同名 interface 会自动合并 ---
interface AppConfig {
  debug: boolean;
}
interface AppConfig {
  version: string;
}
// 合并后 AppConfig 同时有 debug 和 version
const appConfig: AppConfig = { debug: true, version: '1.0.0' };


// ============================================================================
// 7. 类型别名 (type)
// ============================================================================

// --- 基础类型别名 ---
type ID = string | number;  // 联合类型别名

// --- 对象类型 ---
type Point = {
  x: number;
  y: number;
};

// --- type vs interface 的选择 ---
// interface：适合描述对象形状、需要 extends 继承、需要声明合并
// type：适合联合类型、交叉类型、元组、映射类型等复杂类型运算

// --- 字符串字面量联合 ---
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// --- 数值字面量联合 ---
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;


// ============================================================================
// 8. 联合类型与交叉类型
// ============================================================================

// --- 联合类型 (Union)：表示"其中之一"，用 | ---
type StringOrNumber = string | number;
function printId(id: StringOrNumber) {
  // 只能使用 string 和 number 的公共方法
  // id.toUpperCase();  // ❌ number 没有 toUpperCase
  console.log(String(id));  // ✅ 两者都能转 string
}

// --- 交叉类型 (Intersection)：表示"同时满足"，用 & ---
type HasName = { name: string };
type HasAge = { age: number };
type Person = HasName & HasAge;  // 同时有 name 和 age
const p: Person = { name: 'Alice', age: 25 };

// --- 实际场景：组合基础类型 ---
type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
};
type SoftDelete = {
  deletedAt: Date | null;
};

// 数据库实体 = 业务字段 + 时间戳 + 软删除
interface UserEntity extends Timestamps, SoftDelete {
  id: number;
  name: string;
}


// ============================================================================
// 9. 字面量类型与类型收窄 (Narrowing)
// ============================================================================

// --- 字面量类型 ---
const hello: 'hello' = 'hello';  // 类型不是 string，而是字面量 'hello'
// const hello2: 'hello' = 'world';  // ❌

// --- typeof 收窄 ---
function processValue(value: string | number) {
  if (typeof value === 'string') {
    value.toUpperCase();   // 这里 value 是 string
  } else {
    value.toFixed(2);      // 这里 value 是 number
  }
}

// --- in 操作符收窄 ---
interface Fish { swim(): void; }
interface Bird { fly(): void; }

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim();  // 这里 animal 是 Fish
  } else {
    animal.fly();   // 这里 animal 是 Bird
  }
}

// --- instanceof 收窄 ---
class DogError extends Error {
  bark() { console.log('Woof!'); }
}

function handleError(err: Error) {
  if (err instanceof DogError) {
    err.bark();  // 这里 err 是 DogError
  }
}

// --- 自定义类型守卫 (type predicate) ---
interface Cat { meow(): void; litterBox: boolean; }
interface Fish2 { swim(): void; water: string; }

function isCat(pet: Cat | Fish2): pet is Cat {
  return 'litterBox' in pet;
  // 'pet is Cat' 就是类型谓词，告诉编译器：返回 true 时 pet 是 Cat
}

const pet: Cat | Fish2 = { meow() {}, litterBox: true };
if (isCat(pet)) {
  pet.meow();  // ✅ 编译器知道 pet 是 Cat
}

// --- 可辨识联合 (Discriminated Union)：最常用的模式 ---
// 每个变体都有一个共同的字面量字段（tag），用于区分
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;      // 自动收窄为 circle
    case 'rectangle':
      return shape.width * shape.height;         // 自动收窄为 rectangle
    case 'triangle':
      return 0.5 * shape.base * shape.height;    // 自动收窄为 triangle
  }
}

// --- 空值收窄 ---
function printLength(str: string | null | undefined) {
  if (str) {
    console.log(str.length);  // str 非空，安全使用
  }
  // 或用空值合并运算符
  console.log(str?.length ?? 0);
}


// ============================================================================
// 10. 类 (class)
// ============================================================================

// --- 基础类 ---
class Animal2 {
  // 访问修饰符：public（默认）、private、protected
  // readonly 修饰符：只读属性
  constructor(
    public readonly name: string,     // public + readonly，自动赋值
    private _age: number,             // private，外部不可访问
    protected species: string,        // protected，子类可访问
  ) {}

  // getter / setter
  get age(): number {
    return this._age;
  }
  set age(value: number) {
    if (value < 0) throw new Error('Age cannot be negative');
    this._age = value;
  }

  // 实例方法
  describe(): string {
    return `${this.name} (${this.species}), age ${this._age}`;
  }

  // 静态成员
  static readonly MAX_AGE = 200;
  static create(name: string, age: number): Animal2 {
    return new Animal2(name, age, 'unknown');
  }
}

// --- 继承 ---
class Pet extends Animal2 {
  constructor(
    name: string,
    age: number,
    private owner: string,  // 子类自己的私有属性
  ) {
    super(name, age, 'pet');  // 调用父类构造函数
  }

  // 方法重写
  override describe(): string {
    return `${super.describe()}, owned by ${this.owner}`;
  }
}

// --- 抽象类：不能直接实例化，只能被继承 ---
abstract class Shape2 {
  abstract area(): number;  // 抽象方法，子类必须实现

  describe(): void {
    console.log(`Area = ${this.area().toFixed(2)}`);
  }
}

class Circle extends Shape2 {
  constructor(private radius: number) {
    super();
  }
  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

// --- 实现接口 ---
interface Loggable {
  log(): string;
}

class Logger implements Loggable {
  constructor(private message: string) {}
  log(): string {
    return `[LOG] ${this.message}`;
  }
}

// --- 参数属性简写 ---
// 在构造函数参数前加修饰符，自动声明并赋值同名字段
class ShortHand {
  constructor(
    public readonly id: number,
    private name: string,
    protected value: number = 0,  // 还可以有默认值
  ) {}
}


// ============================================================================
// 11. 泛型 (Generics)
// ============================================================================

// --- 泛型函数：类型参数在调用时确定 ---
function identity<T>(value: T): T {
  return value;
}
identity<string>('hello');  // 显式指定 T = string
identity(42);               // 自动推断 T = number

// --- 泛型约束 (extends) ---
// 约束 T 必须有 length 属性
function logLength<T extends { length: number }>(value: T): void {
  console.log(`Length: ${value.length}`);
}
logLength('hello');       // ✅ string 有 length
logLength([1, 2, 3]);     // ✅ array 有 length
// logLength(42);          // ❌ number 没有 length

// --- 泛型接口 ---
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface UserDTO {
  id: number;
  name: string;
}

const response: ApiResponse<UserDTO> = {
  code: 200,
  message: 'ok',
  data: { id: 1, name: 'Alice' },
};

// --- 泛型类 ---
class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): T[] {
    return [...this.items];
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }
}

const numContainer = new Container<number>();
numContainer.add(1);
numContainer.add(2);

// --- 多个类型参数 ---
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}
pair('hello', 42);  // [string, number]

// --- keyof + 泛型：安全地访问对象属性 ---
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user2 = { name: 'Alice', age: 25 };
getProperty(user2, 'name');  // ✅ 返回 string
// getProperty(user2, 'foo');  // ❌ 'foo' 不是 user2 的键

// --- 泛型默认值 ---
interface Pagination<T, P = { page: number; size: number }> {
  data: T[];
  pagination: P;
}


// ============================================================================
// 12. 类型断言与类型守卫
// ============================================================================

// --- 类型断言 (as)：告诉编译器"我知道这是什么类型" ---
const someValue: unknown = 'hello';
const strLength = (someValue as string).length;

// 双重断言（极少用）
const el = document.getElementById('app') as HTMLDivElement;

// --- 非空断言 (!)：告诉编译器"这个值不是 null/undefined" ---
function processElement(el: HTMLElement | null) {
  el!.classList.add('active');  // 你确定 el 不为 null
}

// --- satisfies 操作符 (TS 4.9+)：验证类型但不改变推断类型 ---
const colors = {
  red: 'red',
  green: 'green',
  blue: 'blue',
} satisfies Record<string, string>;
// colors 的类型仍然是 { red: string; green: string; blue: string }
// 而不是 Record<string, string>，保留了精确的类型信息

// --- as const：将对象/数组变为深度只读 + 字面量类型 ---
const config2 = {
  port: 3000,
  host: 'localhost',
} as const;
// 类型变为 { readonly port: 3000; readonly host: 'localhost' }
type Port = typeof config2.port;  // 类型是 3000（字面量），不是 number


// ============================================================================
// 13. 工具类型 (Utility Types)
// ============================================================================
// TS 内置了大量工具类型，日常开发高频使用。

interface Todo {
  title: string;
  description: string;
  completed: boolean;
  priority: number;
}

// --- Partial<T>：所有属性变为可选 ---
type UpdateTodo = Partial<Todo>;
// { title?: string; description?: string; completed?: boolean; priority?: number }

// --- Required<T>：所有属性变为必填 ---
type StrictTodo = Required<Todo & { description?: string }>;

// --- Readonly<T>：所有属性变为只读 ---
type FrozenTodo = Readonly<Todo>;

// --- Pick<T, K>：从 T 中选取部分属性 ---
type TodoPreview = Pick<Todo, 'title' | 'completed'>;
// { title: string; completed: boolean }

// --- Omit<T, K>：从 T 中排除部分属性 ---
type TodoWithoutDesc = Omit<Todo, 'description'>;
// { title: string; completed: boolean; priority: number }

// --- Record<K, V>：键为 K、值为 V 的字典类型 ---
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;
const roles: UserRoles = { alice: 'admin', bob: 'user' };

// --- Exclude<T, U>：从联合类型中排除某些成员 ---
type Status2 = 'success' | 'error' | 'loading' | 'idle';
type ActiveStatus = Exclude<Status2, 'idle'>;
// 'success' | 'error' | 'loading'

// --- Extract<T, U>：从联合类型中提取某些成员 ---
type SuccessOrError = Extract<Status2, 'success' | 'error'>;
// 'success' | 'error'

// --- NonNullable<T>：从类型中排除 null 和 undefined ---
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>;  // string

// --- ReturnType<T>：获取函数的返回值类型 ---
function createUser(): UserDTO {
  return { id: 1, name: 'Alice' };
}
type UserReturn = ReturnType<typeof createUser>;  // UserDTO

// --- Parameters<T>：获取函数的参数类型（元组） ---
type CreateUserParams = Parameters<typeof createUser>;  // []（无参数）

function fetchUserWithDetails(id: number, includeDetails: boolean): Promise<UserDTO> {
  return Promise.resolve({ id, name: 'test' });
}
type FetchUserParams = Parameters<typeof fetchUserWithDetails>;  // [id: number, includeDetails: boolean]

// --- Awaited<T>：获取 Promise 的内部类型 ---
type Unwrapped = Awaited<Promise<UserDTO>>;  // UserDTO

// --- 实际场景：API 请求封装 ---
interface ApiResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 组合工具类型创建新的 API 响应类型
type CreateUserResponse = ApiResult<Pick<UserDTO, 'id'>>;
type ListUsersResponse = ApiResult<{
  users: UserDTO[];
  total: number;
}>;


// ============================================================================
// 14. 条件类型与映射类型
// ============================================================================

// --- 条件类型：类似三元表达式 ---
// T extends U ? X : Y
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<string>;   // 'yes'
type B = IsString<number>;   // 'no'

// --- 实际场景：根据类型参数决定返回值 ---
type ResponseFormat<T extends 'json' | 'text'> =
  T extends 'json' ? object : string;

function fetchData2<T extends 'json' | 'text'>(format: T): ResponseFormat<T> {
  // 实现省略
  return (format === 'json' ? {} : '') as ResponseFormat<T>;
}

// --- 映射类型：基于已有类型创建新类型 ---
// 将每个属性变为可选 + 添加 null 联合
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};
type NullableTodo = Nullable<Todo>;
// { title: string | null; description: string | null; ... }

// --- 添加前缀/后缀的映射类型 ---
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type TodoGetters = Getters<Todo>;
// { getTitle: () => string; getDescription: () => string; ... }

// --- 用 infer 在条件类型中推断类型 ---
// 提取数组元素类型
type ElementType<T> = T extends (infer E)[] ? E : T;
type Num = ElementType<number[]>;   // number
type Str = ElementType<string>;     // string

// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type UnwrappedUser = UnwrapPromise<Promise<UserDTO>>;  // UserDTO

// 提取函数第一个参数类型
type FirstParam<T> = T extends (first: infer P, ...rest: any[]) => any ? P : never;
type FP = FirstParam<(x: string, y: number) => void>;  // string


// ============================================================================
// 15. 模板字面量类型 (TS 4.1+)
// ============================================================================

// --- 基础用法：用模板字符串构造类型 ---
type EventName = 'click' | 'focus' | 'blur';
type EventHandler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'

// --- 字符串操作类型 ---
type Upper = Uppercase<'hello'>;       // 'HELLO'
type Lower = Lowercase<'HELLO'>;       // 'hello'
type Cap = Capitalize<'hello'>;        // 'Hello'
type Uncap = Uncapitalize<'Hello'>;    // 'hello'

// --- 实际场景：类型安全的事件系统 ---
type EventType = 'user.created' | 'user.deleted' | 'order.placed';
type EventPayload = {
  [K in EventType]: {
    type: K;
    timestamp: number;
  };
};
// EventPayload['user.created'] => { type: 'user.created'; timestamp: number }

// --- 实际场景：CSS 类名类型 ---
type Size = 'sm' | 'md' | 'lg';
type Color = 'primary' | 'secondary';
type ButtonClass = `btn-${Size}-${Color}`;
// 'btn-sm-primary' | 'btn-sm-secondary' | 'btn-md-primary' | ...


// ============================================================================
// 16. 索引签名与 keyof / typeof
// ============================================================================

// --- typeof：获取变量的类型 ---
const sample = { x: 1, y: 'hello', z: true };
type SampleType = typeof sample;
// { x: number; y: string; z: boolean }

// --- keyof：获取对象类型的所有键（联合类型） ---
type TodoKeys = keyof Todo;
// 'title' | 'description' | 'completed' | 'priority'

// --- 组合使用：安全地遍历对象 ---
function pick2<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    result[key] = obj[key];
  });
  return result;
}

// --- 索引访问类型 (Indexed Access Type) ---
type TodoTitle = Todo['title'];         // string
type TodoKeys2 = Todo['title' | 'priority']; // string | number

// --- 数字索引签名 ---
interface StringArray {
  [index: number]: string;  // 数组的底层就是数字索引签名
}

// --- 实际场景：类型安全的事件发射器 ---
interface EventMap {
  'user:login': { userId: string };
  'user:logout': { userId: string };
  'data:update': { key: string; value: unknown };
}

class TypedEmitter {
  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) {
    // 实现省略
  }
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    // 实现省略
  }
}
const emitter = new TypedEmitter();
emitter.on('user:login', (payload) => {
  console.log(payload.userId);  // ✅ 类型安全
});


// ============================================================================
// 17. 异步编程 (Promise / async-await)
// ============================================================================

// --- Promise 类型注解 ---
function fetchUser(id: number): Promise<UserDTO> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: `User ${id}` });
      } else {
        reject(new Error('Invalid ID'));
      }
    }, 100);
  });
}

// --- async/await ---
async function getUser(id: number): Promise<UserDTO> {
  try {
    const user = await fetchUser(id);
    return user;
  } catch (error) {
    // error 默认是 unknown 类型（TS 4.4+ 严格模式）
    if (error instanceof Error) {
      console.error(error.message);
    }
    throw error;
  }
}

// --- 并行执行多个异步操作 ---
async function getAllUsers(ids: number[]): Promise<UserDTO[]> {
  const promises = ids.map((id) => fetchUser(id));
  // Promise.all 等待所有完成
  const results = await Promise.all(promises);
  return results;
}

// --- Promise.allSettled：不因单个失败而中断 ---
async function fetchAllSafe(ids: number[]) {
  const results = await Promise.allSettled(ids.map((id) => fetchUser(id)));
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      console.log('Success:', result.value);
    } else {
      console.log('Failed:', result.reason);
    }
  });
}

// --- 带超时的 Promise ---
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });
  return Promise.race([promise, timeout]);
}

// --- 异步迭代器 ---
async function* generateIds(start: number, end: number) {
  for (let i = start; i <= end; i++) {
    await new Promise((r) => setTimeout(r, 100));  // 模拟异步
    yield i;
  }
}

// 使用
(async () => {
  for await (const id of generateIds(1, 3)) {
    console.log(id);  // 1, 2, 3（每隔 100ms）
  }
})();


// ============================================================================
// 18. 模块系统 (import / export)
// ============================================================================

// --- 命名导出 ---
export const API_BASE = 'https://api.example.com';
export function formatDate(date: Date): string {
  return date.toISOString();
}
export class HttpClient {
  constructor(public baseUrl: string) {}
}

// --- 默认导出 ---
export default class UserService {
  static getInstance(): UserService {
    return new UserService();
  }
}

// --- 导入语法（示例，实际使用时取消注释） ---
// import UserService from './user-service';           // 默认导入
// import { HttpClient, API_BASE } from './http';       // 命名导入
// import * as Utils from './utils';                    // 命名空间导入
// import UserService, { HttpClient } from './module';  // 混合导入
// import type { UserDTO } from './types';              // 仅导入类型（编译后擦除）

// --- 重新导出 ---
// export { HttpClient } from './http';
// export * from './types';
// export * as utils from './utils';

// --- 动态导入（懒加载） ---
// async function loadModule() {
//   const { HttpClient } = await import('./http-client.ts');
//   // 只在需要时才加载模块，适合代码分割
// }


// ============================================================================
// 19. 声明合并与扩展
// ============================================================================

// --- 扩展全局类型（如给 Window 添加自定义属性） ---
declare global {
  interface Window {
    __APP_CONFIG__: {
      apiBaseUrl: string;
      version: string;
    };
  }
}
// 之后可以安全使用：window.__APP_CONFIG__.apiBaseUrl

// --- 扩展第三方库的类型（声明模块） ---
// declare module 'some-untyped-library' {
//   export function doSomething(input: string): Promise<void>;
//   export const version: string;
// }

// --- 扩展已有接口（如 Express 的 Request） ---
// 常见场景：给 req 添加 user 属性
// declare module 'express-serve-static-core' {
//   interface Request {
//     user?: { id: string; role: string };
//   }
// }

// --- .d.ts 声明文件说明 ---
// 实际项目中，全局声明通常放在单独的 .d.ts 文件中：
// global.d.ts:
//   export {};
//   declare global { ... }
// env.d.ts:
//   /// <reference types="vite/client" />


// ============================================================================
// 20. 实用技巧与最佳实践
// ============================================================================

// --- 1. 用 as const + typeof 从常量生成类型 ---
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = typeof ROLES[number];  // 'admin' | 'editor' | 'viewer'

const API_ENDPOINTS = {
  users: '/api/users',
  orders: '/api/orders',
} as const;
type Endpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
// '/api/users' | '/api/orders'

// --- 2. 用 satisfies 保留字面量类型 ---
const palette = {
  primary: '#007bff',
  secondary: '#6c757d',
} satisfies Record<string, string>;
// palette.primary 类型是 string，但 palette 的键是精确的 'primary' | 'secondary'

// --- 3. 品牌类型 (Branded Type)：防止不同类型混用 ---
type UserId = string & { __brand: 'UserId' };
type OrderId = string & { __brand: 'OrderId' };

function toUserId(id: string): UserId {
  return id as UserId;
}
const uid: UserId = toUserId('123');
// const oid: OrderId = uid;  // ❌ 编译报错，UserId 不能赋给 OrderId

// --- 4. 用 const 泛型参数保留精确类型 (TS 5.0+) ---
function route<const T extends string[]>(path: [...T]): T {
  return path;
}
const r = route(['users', ':id', 'posts']);
// 类型是 readonly ['users', ':id', 'posts']，而非 string[]

// --- 5. 构建器模式 (Builder Pattern) ---
class QueryBuilder<T extends object> {
  private conditions: string[] = [];

  where<K extends keyof T>(key: K, value: T[K]): this {
    this.conditions.push(`${String(key)} = ${value}`);
    return this;  // 返回 this 支持链式调用
  }

  build(): string {
    return `SELECT * WHERE ${this.conditions.join(' AND ')}`;
  }
}

interface UserTable {
  id: number;
  name: string;
  age: number;
}

const query = new QueryBuilder<UserTable>()
  .where('name', 'Alice')  // ✅ name 必须是 string
  .where('age', 25)         // ✅ age 必须是 number
  // .where('name', 123)    // ❌ 类型错误
  .build();

// --- 6. 用 Record + 枚举实现类型安全的映射 ---
type Priority = 'low' | 'medium' | 'high';
type PriorityLabel = Record<Priority, string>;

const priorityLabels: PriorityLabel = {
  low: '低优先级',
  medium: '中优先级',
  high: '高优先级',
};
// 如果漏写某个 key，编译器会报错

// --- 7. 函数重载 + 泛型结合 ---
function createElement(tag: 'input'): HTMLInputElement;
function createElement(tag: 'img'): HTMLImageElement;
function createElement(tag: string): HTMLElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}
const input = createElement('input');  // 类型是 HTMLInputElement
const img = createElement('img');      // 类型是 HTMLImageElement
const div = createElement('div');      // 类型是 HTMLElement

// --- 8. 用 sealed 模式模拟封闭类型 ---
// 通过私有构造函数 + 静态工厂方法，控制实例化
class AppResult<T> {
  private constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: string,
  ) {}

  static ok<T>(data: T): AppResult<T> {
    return new AppResult<T>(true, data);
  }

  static fail<T = never>(error: string): AppResult<T> {
    return new AppResult<T>(false, undefined, error);
  }
}

const okResult = AppResult.ok({ id: 1 });
const failResult = AppResult.fail('Not found');

// --- 9. 类型安全的 EventEmitter ---
type EventTypes = {
  login: { userId: string; timestamp: number };
  logout: { userId: string };
  error: { code: number; message: string };
};

// 利用映射类型 + 泛型实现类型安全的事件系统
type EventHandlers<T> = {
  [K in keyof T]?: Array<(payload: T[K]) => void>;
};

// --- 10. 实用类型组合技 ---
// 深度 Partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// 深度 Readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// 从数组类型中提取元素类型
type Flatten<T> = T extends Array<infer E> ? E : T;
type Item = Flatten<string[]>;  // string

// 互斥类型（A 和 B 只能有一个）
type XOR<A, B> =
  | (A & { [K in Exclude<keyof B, keyof A>]?: never })
  | (B & { [K in Exclude<keyof A, keyof B>]?: never });

type Config3 = XOR<{ port: number }, { socketPath: string }>;
const c1: Config3 = { port: 3000 };              // ✅
const c2: Config3 = { socketPath: '/tmp/sock' }; // ✅
// const c3: Config3 = { port: 3000, socketPath: '/tmp/sock' };  // ❌


// ============================================================================
// 总结：日常开发最常用的 TOP 10
// ============================================================================
//
// 1. interface / type          → 定义数据结构
// 2. 泛型 <T>                  → 复用类型逻辑
// 3. Partial / Pick / Omit     → 灵活变换类型
// 4. 联合类型 + switch 收窄    → 处理多种情况
// 5. as const + typeof         → 从值生成类型
// 6. Record<K, V>              → 字典/映射类型
// 7. async/await + Promise     → 异步编程
// 8. 可选链 ?. + 空值合并 ??   → 安全访问
// 9. keyof + 索引访问          → 类型安全的属性操作
// 10. 可辨识联合               → 状态机/事件系统建模
//
// 掌握以上 10 点，即可覆盖日常 90%+ 的 TypeScript 开发场景。
// ============================================================================
