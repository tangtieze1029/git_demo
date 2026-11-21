/**
 * ============================================================================
 * TypeScript 演示 ES6 核心语法
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-es6-core-syntax-demo.ts
 *
 * 类型校验：
 *   npx tsc --noEmit
 *
 * 覆盖清单：
 *   1.  let / const 与块级作用域
 *   2.  模板字符串与标签模板
 *   3.  解构赋值（数组 / 对象 / 嵌套 / 重命名 / 默认值 / 函数参数）
 *   4.  展开运算符与剩余参数
 *   5.  箭头函数与 this
 *   6.  函数参数默认值
 *   7.  对象字面量增强（属性简写 / 计算属性 / 方法简写）
 *   8.  class 与继承（构造器参数属性 / 方法重写 / getter / static）
 *   9.  Symbol 与迭代器协议
 *  10.  生成器 Generator
 *  11.  Map / Set
 *  12.  Promise 与 async / await
 *  13.  数组与对象新增 API
 *  14.  可选链 / 空值合并（ES2020 补充）
 *  15.  for...of 与 for...in
 * ============================================================================
 */

// ============================================================================
// 1. let / const 与块级作用域
//    - let：块级作用域，可重新赋值
//    - const：块级作用域，声明后不能重新赋值（对象内部属性仍可变）
// ============================================================================
function blockScopeDemo(): void {
  console.log('1) let / const 与块级作用域：');

  let total = 0;
  const base = 10;
  for (let i = 0; i < 3; i++) total += i;
  console.log('   for 累加结果：', total, '基准值：', base);

  // 编译期示例：放进永不调用的函数里，运行时不会执行
  function _constReassignCompileError(): void {
    // @ts-expect-error const 声明后不能重新赋值
    base = 20;
  }

  function _loopVarCompileError(): void {
    // @ts-expect-error 循环变量 i 只存在于 for 块内
    console.log(i);
  }

  // 仅作编译期示例存在，运行时不会调用
  void [_constReassignCompileError, _loopVarCompileError];

  // 块级作用域 + 闭包：每次迭代都是新的 i（var 会全部输出 3）
  const fns: Array<() => number> = [];
  for (let i = 0; i < 3; i++) fns.push(() => i);
  console.log('   闭包捕获的 i：', fns.map((fn) => fn()));

  // const 约束的是绑定，不是对象内容
  const mutableObject = { count: 0 };
  mutableObject.count += 1;
  console.log('   const 对象的属性可修改：', mutableObject.count);
}

// ============================================================================
// 2. 模板字符串与标签模板
// ============================================================================
function templateLiteralDemo(): void {
  console.log('\n2) 模板字符串与标签模板：');

  const user = { name: 'Alice', age: 30, skills: ['TS', 'React'] };

  // 多行 + 插值（插值里可以放任意表达式）
  const intro = `姓名：${user.name}
年龄：${user.age}
技能数：${user.skills.length}`;
  console.log(intro);

  // 标签模板：把字符串片段与插值结果交给函数加工
  const highlight = (strings: TemplateStringsArray, ...values: Array<string | number>): string =>
    strings.reduce((acc, str, index) => {
      const value = values[index];
      return value === undefined ? `${acc}${str}` : `${acc}${str}【${value}】`;
    }, '');

  console.log('   标签模板：', highlight`用户 ${user.name} 年龄 ${user.age}`);
}

// ============================================================================
// 3. 解构赋值
// ============================================================================
interface DemoUser {
  id: number;
  info: { name: string; city?: string };
  role?: string;
}

function destructuringDemo(): void {
  console.log('\n3) 解构赋值：');

  // 数组解构：默认值（元素为 undefined 时生效）+ 剩余元素
  const numbers: Array<number | undefined> = [1, undefined, 3, 4];
  const [first = 0, second = 2, ...others] = numbers;
  console.log('   数组解构：', { first, second, others });

  // 交换变量不需要中间变量
  let left = 'L';
  let right = 'R';
  [left, right] = [right, left];
  console.log('   交换后：', left, right);

  // 对象解构：嵌套 + 重命名 + 默认值
  const user: DemoUser = { id: 1, info: { name: 'Bob' } };
  const {
    id,
    info: { name, city = '未知' },
    role = 'guest',
  } = user;
  console.log('   对象解构：', { id, name, city, role });

  // 函数参数解构
  const printUser = ({ id, info: { name } }: DemoUser): string => `#${id} ${name}`;
  console.log('   参数解构：', printUser(user));
}

// ============================================================================
// 4. 展开运算符与剩余参数
// ============================================================================
function spreadRestDemo(): void {
  console.log('\n4) 展开运算符与剩余参数：');

  const arrA = [1, 2];
  const arrB = [3, 4];
  console.log('   数组合并：', [...arrA, ...arrB]);
  console.log('   浅拷贝：', [...arrA]);
  console.log('   首尾追加：', [0, ...arrA, 99]);

  const baseConfig = { host: 'localhost', port: 3000 };
  const overrideConfig = { port: 8080, secure: true };
  console.log('   对象合并（后者覆盖前者）：', { ...baseConfig, ...overrideConfig });

  // 剩余参数收集实参，展开运算符再把数组摊开
  const sum = (...nums: number[]): number => nums.reduce((acc, n) => acc + n, 0);
  const values = [1, 2, 3, 4];
  console.log('   sum(...values)：', sum(...values));

  // 字符串也是可迭代对象
  console.log('   展开字符串：', [...'ES6']);
}

// ============================================================================
// 5. 箭头函数与 this
//    - 箭头函数没有自己的 this / arguments，this 来自定义时的外层作用域
// ============================================================================
function arrowFunctionDemo(): void {
  console.log('\n5) 箭头函数与 this：');

  const double = (n: number): number => n * 2; // 单参数 / 单表达式可省略括号与 return
  console.log('   箭头函数简写：', double(21));

  const counter = {
    count: 1,
    incrementByRegular(): number {
      return this.count + 1; // this 指向调用者 counter
    },
    incrementByArrow(): number {
      const inner = (): number => this.count + 1; // this 继承自 incrementByArrow
      return inner();
    },
  };
  console.log('   普通方法 this：', counter.incrementByRegular());
  console.log('   箭头函数继承 this：', counter.incrementByArrow());

  // 数组回调是箭头函数最常见的用法（不绑定自己的 this）
  const scores = [60, 75, 90];
  console.log('   链式处理：', scores.filter((s) => s >= 70).map((s) => s + 5));
}

// ============================================================================
// 6. 函数参数默认值
// ============================================================================
function defaultParamDemo(): void {
  console.log('\n6) 函数参数默认值：');

  const greet = (name = '访客', times = 1): string =>
    Array.from({ length: times }, () => `你好 ${name}`).join(' | ');
  console.log('   省略全部参数：', greet());
  console.log('   只传第一个：', greet('Alice'));
  console.log('   显式传 undefined 也走默认值：', greet(undefined, 2));
}

// ============================================================================
// 7. 对象字面量增强
// ============================================================================
function objectEnhanceDemo(): void {
  console.log('\n7) 对象字面量增强：');

  const name = 'Alice';
  const age = 30;
  const key = 'level' as const;

  const user = {
    name, // 属性简写：等价于 name: name
    age,
    [key]: 3, // 计算属性名
    [`${key}Label`]: '高级',
    sayHi(): string {
      // 方法简写：等价于 sayHi: function () {...}
      return `hi, ${this.name}`;
    },
  };

  console.log('   增强后的对象：', user);
  console.log('   方法简写：', user.sayHi());
}

// ============================================================================
// 8. class 与继承
// ============================================================================
function classDemo(): void {
  console.log('\n8) class 与继承：');

  class Animal {
    static readonly kingdom = 'Animalia';

    constructor(protected readonly name: string) {} // 构造器参数属性

    speak(): string {
      return `${this.name} 发出声音`;
    }
  }

  class Dog extends Animal {
    private readonly breed: string;

    constructor(name: string, breed: string) {
      super(name); // 使用 this 前必须先调用 super
      this.breed = breed;
    }

    override speak(): string {
      return `${super.speak()}：汪汪（${this.breed}）`;
    }

    get description(): string {
      return `${this.name} 属于 ${Dog.kingdom}`;
    }
  }

  const dog = new Dog('旺财', '柴犬');
  console.log('   方法重写 + super：', dog.speak());
  console.log('   静态属性 + getter：', dog.description);
}

// ============================================================================
// 9. Symbol 与迭代器协议
// ============================================================================
function symbolIteratorDemo(): void {
  console.log('\n9) Symbol 与迭代器协议：');

  // Symbol 生成的键全局唯一，不会与字符串键冲突
  const secret = Symbol('secret');
  const holder: { [secret]: string; visible: string } = {
    [secret]: 'hidden',
    visible: 'public',
  };
  console.log('   Symbol 键取值：', holder[secret]);
  console.log('   Object.keys 看不到 Symbol 键：', Object.keys(holder));
  console.log('   Reflect.ownKeys 能看到：', Reflect.ownKeys(holder).map(String));

  // 实现迭代器协议后，可直接 for...of / 展开 / Array.from
  const range: Iterable<number> = {
    *[Symbol.iterator](): Generator<number> {
      for (let i = 1; i <= 3; i++) yield i;
    },
  };
  console.log('   自定义可迭代对象：', [...range]);
  console.log('   Array.from 带映射：', Array.from(range, (n) => n * 10));
}

// ============================================================================
// 10. 生成器 Generator
// ============================================================================
function generatorDemo(): void {
  console.log('\n10) 生成器 Generator：');

  function* idGenerator(start = 1): Generator<number> {
    let id = start;
    while (true) {
      yield id++;
    }
  }

  // 惰性求值：调用 next 才继续执行到下一个 yield
  const ids = idGenerator(10);
  console.log('   惰性取值：', [ids.next().value, ids.next().value, ids.next().value]);

  function* countdown(from: number): Generator<number> {
    for (let i = from; i > 0; i--) yield i;
  }
  console.log('   for...of 消费生成器：', [...countdown(3)]);
}

// ============================================================================
// 11. Map / Set
// ============================================================================
function mapSetDemo(): void {
  console.log('\n11) Map / Set：');

  const scores = new Map<string, number>([
    ['Alice', 92],
    ['Bob', 78],
  ]);
  scores.set('Cara', 85);
  console.log(
    '   Map 查询：',
    scores.get('Alice'),
    '| has Bob：',
    scores.has('Bob'),
    '| size：',
    scores.size,
  );
  for (const [name, score] of scores) console.log(`   ${name} → ${score}`);

  const unique = new Set<number>([1, 2, 2, 3, 3, 3]);
  console.log('   Set 去重：', [...unique], '| size：', unique.size);
  unique.add(4);
  console.log('   add 之后：', [...unique]);
}

// ============================================================================
// 12. Promise 与 async / await
// ============================================================================
async function promiseAsyncDemo(): Promise<void> {
  console.log('\n12) Promise 与 async / await：');

  const delay = (ms: number, value: string): Promise<string> =>
    new Promise((resolve) => {
      setTimeout(() => resolve(value), ms);
    });

  // 并发执行，总耗时取决于最慢的那个
  const results = await Promise.all([delay(10, 'A'), delay(5, 'B')]);
  console.log('   Promise.all 结果：', results);

  // 用 try/catch 捕获 reject，等价于 Promise 的 .catch
  try {
    await Promise.reject(new Error('模拟失败'));
  } catch (error) {
    console.log('   try/catch 捕获 reject：', (error as Error).message);
  }
}

// ============================================================================
// 13. 数组与对象新增 API
// ============================================================================
function newApiDemo(): void {
  console.log('\n13) 数组与对象新增 API：');

  console.log('   Array.from（类数组 / 可迭代）：', Array.from('abc'));
  console.log('   Array.of（避开 new Array(7) 的长度陷阱）：', Array.of(7), Array.of(1, 2, 3));
  console.log('   fill：', new Array<number>(3).fill(0));
  console.log('   includes：', [1, 2, 3].includes(2));
  console.log(
    '   find / findIndex：',
    [5, 12, 8].find((n) => n > 10),
    [5, 12, 8].findIndex((n) => n > 10),
  );
  console.log(
    '   flat / flatMap：',
    [[1, 2], [3, [4]]].flat(2),
    [1, 2].flatMap((n) => [n, n * 10]),
  );

  const record: Record<string, number> = { a: 1, b: 2 };
  console.log('   Object.entries：', Object.entries(record));
  console.log(
    '   Object.fromEntries：',
    Object.fromEntries(Object.entries(record).map(([k, v]) => [k, v * 2])),
  );
  console.log('   Object.assign：', Object.assign({}, record, { c: 3 }));

  console.log(
    '   String 新方法：',
    'es6'.startsWith('es'),
    'es6'.endsWith('6'),
    '7'.padStart(3, '0'),
    'ab'.repeat(2),
  );
}

// ============================================================================
// 14. 可选链 / 空值合并（ES2020 补充）
// ============================================================================
interface Profile {
  name: string;
  address?: { city?: string };
}

function optionalChainingDemo(): void {
  console.log('\n14) 可选链 / 空值合并（ES2020 补充）：');

  const withAddress: Profile = { name: 'Alice', address: { city: 'Shanghai' } };
  const withoutAddress: Profile = { name: 'Bob' };

  console.log('   可选链取值：', withAddress.address?.city, withoutAddress.address?.city);
  console.log('   可选调用：', withAddress.address?.city?.toUpperCase());

  const input = { nickname: '' as string | undefined, age: 0 as number | null };
  console.log('   ?? 只处理 null / undefined（空串 / 0 会保留）：', input.nickname ?? '默认昵称', input.age ?? 18);
  console.log('   || 会把 0 / 空串当假值：', input.nickname || '默认昵称', input.age || 18);

  // 逻辑赋值运算符
  let count: number | undefined;
  count ??= 10;
  console.log('   ??= 赋值：', count);
}

// ============================================================================
// 15. for...of 与 for...in
// ============================================================================
function loopDemo(): void {
  console.log('\n15) for...of 与 for...in：');

  const list = ['a', 'b', 'c'];
  for (const [index, value] of list.entries()) {
    console.log(`   for...of 迭代值 [${index}] ${value}`);
  }

  const config = { host: 'localhost', port: 3000 };
  for (const key in config) {
    console.log(`   for...in 迭代键 ${key} → ${config[key as keyof typeof config]}`);
  }
}

// ============================================================================
// 主程序
// ============================================================================
async function main(): Promise<void> {
  blockScopeDemo();
  templateLiteralDemo();
  destructuringDemo();
  spreadRestDemo();
  arrowFunctionDemo();
  defaultParamDemo();
  objectEnhanceDemo();
  classDemo();
  symbolIteratorDemo();
  generatorDemo();
  mapSetDemo();
  await promiseAsyncDemo();
  newApiDemo();
  optionalChainingDemo();
  loopDemo();
}

void main().catch((error) => {
  console.error('演示执行失败：', error);
});
