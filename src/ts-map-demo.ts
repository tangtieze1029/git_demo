/**
 * ============================================================================
 * TypeScript Map 全用法演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-map-demo.ts
 *
 * 覆盖清单：
 *   1.  创建 Map：空构造 / 二维数组初始化 / 类型推断与泛型
 *   2.  增删改查：set / get / has / delete / clear
 *   3.  长度与判空：size
 *   4.  遍历：for...of / forEach / keys / values / entries
 *   5.  键的特性：对象作键 / 函数作键 / NaN 作键 / 同值相等规则
 *   6.  类型实战：Map<string, User> / Map<number, string[]>
 *   7.  与 Object / Array 互转
 *   8.  实战场景：去重计数器 / 缓存 / 分组聚合 / 双向映射
 *   9.  WeakMap 简介与 Map 的对比
 *   10. 常见坑位汇总
 * ============================================================================
 */

interface User {
  id: number;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

// ============================================================================
// 1. 创建 Map
// ============================================================================
function createMapDemo(): void {
  console.log('1) 创建 Map：');

  // 1.1 空 Map
  const empty = new Map<string, number>();
  console.log('   空 Map size：', empty.size);

  // 1.2 用二维数组初始化（元素必须是 [key, value] 元组）
  const init = new Map<string, number>([
    ['one', 1],
    ['two', 2],
    ['three', 3],
  ]);
  console.log('   初始化后：', mapToArray(init));

  // 1.3 类型推断
  const inferred = new Map([
    ['a', 1],
    ['b', 2],
  ]); // 推断为 Map<string, number>
  console.log('   推断类型 Map<string, number>：', mapToArray(inferred));
}

// ============================================================================
// 2. 增删改查
// ============================================================================
function crudDemo(): void {
  console.log('\n2) 增删改查：');

  const map = new Map<string, number>();

  // set：新增或覆盖，支持链式调用
  map.set('x', 10).set('y', 20).set('z', 30);
  console.log('   set 后：', mapToArray(map));

  // get：找不到返回 undefined
  console.log('   get("x")：', map.get('x'));
  console.log('   get("missing")：', map.get('missing'));

  // has：判断键是否存在
  console.log('   has("y")：', map.has('y'));
  console.log('   has("missing")：', map.has('missing'));

  // delete：删除指定键，返回是否成功
  console.log('   delete("y")：', map.delete('y'));
  console.log('   delete("missing")：', map.delete('missing'));
  console.log('   delete 后：', mapToArray(map));

  // clear：清空全部
  map.clear();
  console.log('   clear 后 size：', map.size);
}

// ============================================================================
// 3. 遍历
// ============================================================================
function iterateDemo(): void {
  console.log('\n3) 遍历：');

  const map = new Map<string, number>([
    ['a', 1],
    ['b', 2],
    ['c', 3],
  ]);

  // 3.1 for...of（默认迭代 entries）
  const entries1: Array<[string, number]> = [];
  for (const entry of map) {
    entries1.push(entry);
  }
  console.log('   for...of 默认：', entries1);

  // 3.2 解构写法
  const entries2: Array<[string, number]> = [];
  for (const [k, v] of map) {
    entries2.push([k, v]);
  }
  console.log('   for...of 解构：', entries2);

  // 3.3 keys / values / entries 返回迭代器
  console.log('   keys()：', Array.from(map.keys()));
  console.log('   values()：', Array.from(map.values()));
  console.log('   entries()：', Array.from(map.entries()));

  // 3.4 forEach（注意参数顺序是 value, key, map）
  const forEachResult: string[] = [];
  map.forEach((value, key) => {
    forEachResult.push(`${key}=${value}`);
  });
  console.log('   forEach：', forEachResult);
}

// ============================================================================
// 4. 键的特性：对象/函数/NaN
// ============================================================================
function keyCharacteristicsDemo(): void {
  console.log('\n4) 键的特性：');

  // 4.1 对象作键：引用相等才算同一个键
  const objKey1 = { id: 1 };
  const objKey2 = { id: 1 };
  const map = new Map<object, string>();
  map.set(objKey1, 'obj1');
  map.set(objKey2, 'obj2');
  console.log('   两个结构相同但引用不同的对象键：', map.size); // 2
  console.log('   get(objKey1)：', map.get(objKey1));

  // 4.2 函数作键
  const fn = () => 'hello';
  map.set(fn, 'function value');
  console.log('   函数作键：', map.get(fn));

  // 4.3 NaN 作键：Map 使用 SameValueZero，NaN 与 NaN 相等
  map.set(NaN, 'not a number');
  console.log('   NaN 作键 get(NaN)：', map.get(NaN));
  console.log('   has(NaN)：', map.has(NaN));

  // 4.4 +0 与 -0 视为同一个键
  map.set(+0, 'zero');
  map.set(-0, 'minus zero');
  console.log('   +0 / -0 键数量：', map.size); // 不会新增，因为 +0 === -0 in SameValueZero
  console.log('   get(+0)：', map.get(+0));
}

// ============================================================================
// 5. 类型实战
// ============================================================================
function typedMapDemo(): void {
  console.log('\n5) 类型实战：');

  // 5.1 对象 value
  const userMap = new Map<number, User>();
  userMap.set(1, { id: 1, name: 'Alice', role: 'admin' });
  userMap.set(2, { id: 2, name: 'Bob', role: 'editor' });

  const admins: User[] = [];
  for (const user of userMap.values()) {
    if (user.role === 'admin') admins.push(user);
  }
  console.log('   admin 用户：', admins);

  // 5.2 数组 value
  const grouped = new Map<string, number[]>();
  grouped.set('even', [2, 4, 6]);
  grouped.set('odd', [1, 3, 5]);
  grouped.get('even')?.push(8);
  console.log('   数组 value：', mapToArray(grouped));
}

// ============================================================================
// 6. 与 Object / Array 互转
// ============================================================================
function conversionDemo(): void {
  console.log('\n6) 与 Object / Array 互转：');

  // 6.1 Map → Array（entries）
  const map = new Map([
    ['x', 10],
    ['y', 20],
  ]);
  const arr = Array.from(map);
  console.log('   Map → Array：', arr);

  // 6.2 Array → Map
  const restored = new Map(arr);
  console.log('   Array → Map：', mapToArray(restored));

  // 6.3 Map → Object（键必须是 string | symbol）
  const obj = Object.fromEntries(map);
  console.log('   Map → Object：', obj);

  // 6.4 Object → Map
  const fromObj = new Map<string, unknown>(Object.entries(obj));
  console.log('   Object → Map：', mapToArray(fromObj));
}

// ============================================================================
// 7. 实战场景
// ============================================================================
function practicalDemo(): void {
  console.log('\n7) 实战场景：');

  // 7.1 去重计数器
  const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
  const counter = new Map<string, number>();
  for (const fruit of fruits) {
    counter.set(fruit, (counter.get(fruit) ?? 0) + 1);
  }
  console.log('   水果计数：', mapToArray(counter));

  // 7.2 简单缓存（memoization）
  const cache = new Map<number, number>();
  function fib(n: number): number {
    if (n <= 1) return n;
    if (cache.has(n)) return cache.get(n)!;
    const result = fib(n - 1) + fib(n - 2);
    cache.set(n, result);
    return result;
  }
  console.log('   fib(10)：', fib(10));
  console.log('   缓存内容：', mapToArray(cache));

  // 7.3 分组聚合
  const users: User[] = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'editor' },
    { id: 3, name: 'Carol', role: 'admin' },
    { id: 4, name: 'Dave', role: 'viewer' },
  ];
  const byRole = new Map<User['role'], User[]>();
  for (const user of users) {
    const list = byRole.get(user.role) ?? [];
    list.push(user);
    byRole.set(user.role, list);
  }
  console.log('   按角色分组：', mapToArray(byRole).map(([role, list]) => [role, list.map((u) => u.name)]));

  // 7.4 双向映射（适合枚举值与显示文本互查）
  const codeToName = new Map<number, string>([
    [200, 'OK'],
    [404, 'Not Found'],
    [500, 'Internal Server Error'],
  ]);
  const nameToCode = new Map<string, number>();
  for (const [code, name] of codeToName) {
    nameToCode.set(name, code);
  }
  console.log('   200 →', codeToName.get(200));
  console.log('   Not Found →', nameToCode.get('Not Found'));
}

// ============================================================================
// 8. WeakMap 简介
// ============================================================================
function weakMapDemo(): void {
  console.log('\n8) WeakMap 简介：');

  // WeakMap 只接受对象作为键，且键是弱引用，不影响垃圾回收
  const weak = new WeakMap<object, string>();
  let temp = { id: 99 };
  weak.set(temp, 'temporary data');
  console.log('   设置后 get：', weak.get(temp));

  // 解除引用后，WeakMap 中的条目会被 GC 回收（不可遍历、无 size、无 clear）
  temp = null as unknown as { id: number };
  console.log('   temp 置 null 后，WeakMap 中对应条目将在 GC 后消失');
  console.log('   WeakMap 支持方法：get / set / has / delete（无 size / clear / 遍历）');
}

// ============================================================================
// 9. 常见坑位汇总
// ============================================================================
function pitfallsDemo(): void {
  console.log('\n9) 常见坑位：');

  const map = new Map<string, number>();
  map.set('a', 1);

  // 坑 1：get 不存在的键返回 undefined，无法区分 "未设置" 和 "设置为 undefined"
  map.set('b', undefined as unknown as number);
  console.log('   get("b") 与 get("missing") 都是 undefined');

  // 坑 2：对象键看引用
  map.set({ key: 'obj' } as unknown as string, 100);
  console.log('   用字面量对象作键，get 不回来');

  // 坑 3：forEach 参数顺序是 (value, key, map)，与 Array.forEach 不同
  map.forEach((value, key) => {
    console.log(`   forEach: key=${key}, value=${value}`);
  });
}

// ============================================================================
// 工具函数：把 Map 转成可打印的数组，避免迭代器直接序列化
// ============================================================================
function mapToArray<K, V>(map: Map<K, V>): Array<[K, V]> {
  return Array.from(map.entries());
}

// ============================================================================
// 主入口
// ============================================================================
function main(): void {
  createMapDemo();
  crudDemo();
  iterateDemo();
  keyCharacteristicsDemo();
  typedMapDemo();
  conversionDemo();
  practicalDemo();
  weakMapDemo();
  pitfallsDemo();
}

main();
