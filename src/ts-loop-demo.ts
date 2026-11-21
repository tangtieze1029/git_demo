/**
 * ============================================================================
 * TypeScript 循环用法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-loop-demo.ts
 *
 * 覆盖：
 *   1. 经典 for
 *   2. for...of（数组 / 字符串 / Map / Set / 生成器）
 *   3. for...in（对象键，需过滤原型链）
 *   4. 数组高阶方法：forEach / map / filter / reduce / find / some / every
 *   5. while / do...while
 *   6. 控制流：break / continue / 标签
 *   7. 迭代器：keys / values / entries
 *   8. 异步循环：for await...of
 *   9. TypeScript 类型：readonly / 元组 / Record 的遍历
 * ============================================================================
 */

interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: 'Mouse', price: 99 },
  { id: 2, name: 'Keyboard', price: 299 },
  { id: 3, name: 'Monitor', price: 1299 },
];

// ============================================================================
// 1. 经典 for（带索引）
// ============================================================================
function classicForDemo(): void {
  console.log('1) 经典 for：');
  for (let i = 0; i < products.length; i++) {
    console.log(`   [${i}] ${products[i].name}`);
  }
}

// ============================================================================
// 2. for...of（推荐遍历可迭代对象）
// ============================================================================
function forOfDemo(): void {
  console.log('\n2) for...of：');

  // 数组
  for (const product of products) {
    console.log(`   ${product.name}: ¥${product.price}`);
  }

  // 字符串
  const word = 'TS';
  for (const char of word) {
    console.log(`   char: ${char}`);
  }

  // Map
  const priceMap = new Map<number, number>([
    [1, 99],
    [2, 299],
  ]);
  for (const [id, price] of priceMap) {
    console.log(`   Map entry: id=${id}, price=${price}`);
  }

  // Set
  const tags = new Set(['ts', 'loop', 'demo']);
  for (const tag of tags) {
    console.log(`   Set tag: ${tag}`);
  }
}

// ============================================================================
// 3. for...in（遍历对象键，注意过滤原型链）
// ============================================================================
function forInDemo(): void {
  console.log('\n3) for...in：');

  const user = { name: 'Alice', age: 25 };
  for (const key in user) {
    if (Object.prototype.hasOwnProperty.call(user, key)) {
      // key 被推断为 string；取值需 as keyof typeof
      const value = user[key as keyof typeof user];
      console.log(`   ${key}: ${value}`);
    }
  }
}

// ============================================================================
// 4. 数组高阶方法
// ============================================================================
function arrayMethodsDemo(): void {
  console.log('\n4) 数组高阶方法：');

  // forEach（无返回值）
  products.forEach((product, index) => {
    console.log(`   [${index}] ${product.name}`);
  });

  // map（返回新数组）
  const names = products.map((p) => p.name);
  console.log('   map names:', names);

  // filter（条件筛选）
  const expensive = products.filter((p) => p.price >= 300);
  console.log('   filter >=300:', expensive.map((p) => p.name));

  // reduce（聚合）
  const total = products.reduce((sum, p) => sum + p.price, 0);
  console.log('   reduce total:', total);

  // find（查找首个）
  const found = products.find((p) => p.id === 2);
  console.log('   find id=2:', found?.name);

  // some / every（断言）
  console.log('   some >1000:', products.some((p) => p.price > 1000));
  console.log('   every >0:', products.every((p) => p.price > 0));
}

// ============================================================================
// 5. while / do...while
// ============================================================================
function whileDemo(): void {
  console.log('\n5) while / do...while：');

  let i = 0;
  while (i < products.length) {
    console.log(`   while: ${products[i].name}`);
    i++;
  }

  let j = 0;
  do {
    console.log(`   do...while: ${products[j].name}`);
    j++;
  } while (j < products.length);
}

// ============================================================================
// 6. break / continue / 标签
// ============================================================================
function controlFlowDemo(): void {
  console.log('\n6) break / continue / 标签：');

  // continue：跳过低价商品
  for (const p of products) {
    if (p.price < 100) continue;
    console.log(`   continue >=100: ${p.name}`);
  }

  // break：找到第一个高价商品即停止
  for (const p of products) {
    if (p.price > 500) {
      console.log(`   break at: ${p.name}`);
      break;
    }
  }

  // 标签：跳出外层循环
  outer: for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      if (x === 1 && y === 1) {
        console.log('   break outer at (1,1)');
        break outer;
      }
    }
  }
}

// ============================================================================
// 7. 迭代器 keys / values / entries
// ============================================================================
function iteratorDemo(): void {
  console.log('\n7) 迭代器：');

  const arr = ['a', 'b', 'c'];
  console.log('   keys:', Array.from(arr.keys()));
  console.log('   values:', Array.from(arr.values()));
  console.log('   entries:', Array.from(arr.entries()));

  // 对象用 Object.entries
  const user = { name: 'Bob', age: 30 };
  for (const [key, value] of Object.entries(user)) {
    console.log(`   Object.entries: ${key}=${value}`);
  }
}

// ============================================================================
// 8. 异步循环：for await...of
// ============================================================================
async function asyncLoopDemo(): Promise<void> {
  console.log('\n8) 异步循环：');

  async function fetchPrice(id: number): Promise<number> {
    return Promise.resolve(id * 100);
  }

  // 顺序执行
  for (const p of products) {
    const price = await fetchPrice(p.id);
    console.log(`   async ${p.name}: ¥${price}`);
  }

  // 并发后遍历结果
  const prices = await Promise.all(products.map((p) => fetchPrice(p.id)));
  for (const [index, price] of prices.entries()) {
    console.log(`   concurrent [${index}]: ¥${price}`);
  }
}

// ============================================================================
// 9. TypeScript 类型场景
// ============================================================================
function typedLoopDemo(): void {
  console.log('\n9) TS 类型场景：');

  // readonly 数组：遍历仍可用 for...of / forEach
  const readonlyIds: readonly number[] = [1, 2, 3];
  for (const id of readonlyIds) {
    console.log(`   readonly id: ${id}`);
  }

  // 元组：长度固定，遍历时类型安全
  const tuple: [string, number, boolean] = ['ts', 2024, true];
  for (const item of tuple) {
    console.log(`   tuple item: ${item}`);
  }

  // Record：键值对遍历
  const scores: Record<string, number> = { alice: 90, bob: 85 };
  for (const [name, score] of Object.entries(scores)) {
    console.log(`   Record: ${name}=${score}`);
  }
}

// ============================================================================
// 主入口
// ============================================================================
async function main(): Promise<void> {
  classicForDemo();
  forOfDemo();
  forInDemo();
  arrayMethodsDemo();
  whileDemo();
  controlFlowDemo();
  iteratorDemo();
  await asyncLoopDemo();
  typedLoopDemo();
}

main();
