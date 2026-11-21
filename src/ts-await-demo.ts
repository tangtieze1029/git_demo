/**
 * ============================================================================
 * TypeScript async / await 使用方法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-await-demo.ts
 *
 * 覆盖清单：
 *   1.  async 函数：总是返回 Promise
 *   2.  await 基本用法（串行等待）
 *   3.  await 非 Promise 值（自动包装）
 *   4.  await thenable 对象（鸭子类型）
 *   5.  错误处理：try / catch / finally
 *   6.  并发：Promise.all / allSettled / race / any
 *   7.  循环中的 await：for...of 串行 vs forEach 陷阱 vs map + Promise.all
 *   8.  async 方法与 async 箭头函数
 *   9.  for await...of：异步迭代器（可读流式消费）
 *   10. 超时控制：Promise.race 封装 withTimeout
 *   11. 并发限流：分批执行避免打满下游
 *   12. 顶层 await（ESM）
 *   13. 常见坑位汇总
 * ============================================================================
 */

// ============================================================================
// 通用工具：模拟异步任务
// ============================================================================
/** 模拟一个耗时异步任务，失败时抛出错误 */
function delay<T>(value: T, ms = 100, shouldFail = false): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error(`任务失败: ${String(value)}`));
      else resolve(value);
    }, ms);
  });
}

// ============================================================================
// 1. async 函数：声明的函数总是返回 Promise
//    - 内部 return 的值会被包装成 Promise<T>
//    - 内部 throw 的错误会变成 rejected Promise（不会同步抛出）
// ============================================================================
async function getGreeting(name: string): Promise<string> {
  return `Hello, ${name}`; // 等价于 return Promise.resolve(...)
}

async function getBrokenGreeting(): Promise<string> {
  throw new Error('内部抛错 → 转为 rejected Promise');
}

// ============================================================================
// 2. await 基本用法（串行等待）：后面的代码在 Promise 落定后才执行
// ============================================================================
async function serialDemo(): Promise<string> {
  console.log('   [serial] 开始');
  const a = await delay('A', 80);
  const b = await delay('B', 80);
  console.log('   [serial] 结束');
  return `${a} + ${b}`; // 总耗时约 160ms，因为串行
}

// ============================================================================
// 3. await 非 Promise 值：直接透传，不会额外开一个微任务链条以外的开销
// ============================================================================
/** 可能返回普通值，也可能返回 Promise，await 对两者写法一致 */
function maybePlain(): number | Promise<number> {
  return 42;
}

async function awaitPlainValue(): Promise<number> {
  const x = await maybePlain(); // 非 Promise 会被原样返回
  return x + 1;
}

// ============================================================================
// 4. await thenable：只要对象有 then 方法即可被 await（鸭子类型）
// ============================================================================
const thenable = {
  then(onFulfilled: (v: string) => void) {
    onFulfilled('来自 thenable 的值');
  },
};

// ============================================================================
// 5. 错误处理：try / catch / finally
//    - catch 捕获 await 期间的 reject
//    - finally 无论成功失败都会执行
// ============================================================================
async function errorHandlingDemo(): Promise<string> {
  let cleanup = false;
  try {
    const ok = await delay('成功任务', 30);
    await delay('失败任务', 30, true); // 抛出
    return `不会执行: ${ok}`;
  } catch (err) {
    return `捕获到错误: ${(err as Error).message}`;
  } finally {
    cleanup = true;
    console.log('   [error] finally 执行，cleanup =', cleanup);
  }
}

// ============================================================================
// 6. 并发四兄弟
//    - all       全部成功才成功，一个失败整体 reject（快失败）
//    - allSettled 全部落定后返回状态数组，不会 reject
//    - race      第一个落定（成功或失败）的结果
//    - any       第一个成功的；全失败才 reject（AggregateError）
// ============================================================================
async function concurrencyDemo(): Promise<void> {
  const tasks = [delay('t1', 50), delay('t2', 60), delay('t3', 70)];

  const all = await Promise.all(tasks);
  console.log('   all：', all);

  const settled = await Promise.allSettled([
    delay('ok', 30),
    delay('bad', 30, true),
  ]);
  console.log(
    '   allSettled：',
    settled.map((r) => (r.status === 'fulfilled' ? r.value : (r.reason as Error).message))
  );

  const raced = await Promise.race([delay('fast', 20), delay('slow', 200)]);
  console.log('   race：', raced);

  const anyValue = await Promise.any([
    delay('fail1', 20, true),
    delay('win', 40),
  ]);
  console.log('   any：', anyValue);
}

// ============================================================================
// 7. 循环中的 await
//    - for...of + await：串行，逐个等待
//    - forEach + async：不会被外层 await 等待，是常见坑
//    - map + Promise.all：并发，推荐用于互相独立的任务
// ============================================================================
async function loopDemo(): Promise<void> {
  const ids = [1, 2, 3];

  // 串行
  const serial: string[] = [];
  for (const id of ids) {
    serial.push(await delay(`id-${id}`, 20));
  }
  console.log('   for...of 串行：', serial);

  // forEach 陷阱：外层不会等待内部 async 回调
  const forEachResult: string[] = [];
  ids.forEach(async (id) => {
    forEachResult.push(await delay(`id-${id}`, 20));
  });
  console.log('   forEach 立即输出（此时通常为空）：', forEachResult);

  // 并发
  const parallel = await Promise.all(ids.map((id) => delay(`id-${id}`, 20)));
  console.log('   map + Promise.all 并发：', parallel);
}

// ============================================================================
// 8. async 方法与 async 箭头函数
// ============================================================================
class ApiClient {
  constructor(private readonly baseUrl: string) {}

  // async 方法
  async get(path: string): Promise<string> {
    return delay(`${this.baseUrl}${path}`, 30);
  }
}

const asyncArrow = async (n: number): Promise<number> => {
  const v = await delay(n, 10);
  return v * 2;
};

// ============================================================================
// 9. for await...of：消费异步迭代器（如流式读取）
// ============================================================================
async function* countdown(from: number): AsyncGenerator<number> {
  for (let i = from; i > 0; i--) {
    await delay(null, 10);
    yield i;
  }
}

async function asyncIteratorDemo(): Promise<void> {
  const seen: number[] = [];
  for await (const n of countdown(3)) {
    seen.push(n);
  }
  console.log('   for await...of：', seen);
}

// ============================================================================
// 10. 超时控制：Promise.race 封装
// ============================================================================
async function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`超时 ${ms}ms`)), ms);
  });
  return Promise.race([task, timeout]);
}

// ============================================================================
// 11. 并发限流：按批切分，避免一次性打满下游
// ============================================================================
async function runWithLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...(await Promise.all(batch.map(worker))));
  }
  return results;
}

// ============================================================================
// 12. 顶层 await：ESM 模块中可直接在最外层 await
//     （package.json 中 "type": "module"，tsx 直接支持）
// ============================================================================
const topLevelValue = await delay('顶层 await 结果', 10);

// ============================================================================
// 主函数：集中输出演示结果
// ============================================================================
async function main(): Promise<void> {
  console.log('=== TypeScript async / await 演示 ===\n');

  // 1. async 函数
  console.log('1) async 函数：', await getGreeting('Trae'));
  await getBrokenGreeting().catch((e: Error) =>
    console.log('   内部 throw 被捕获为 reject：', e.message)
  );

  // 2. 串行 await
  console.time('2) serial');
  console.log('2) 串行结果：', await serialDemo());
  console.timeEnd('2) serial');

  // 3. 非 Promise
  console.log('3) await 普通值：', await awaitPlainValue());

  // 4. thenable
  console.log('4) thenable：', await thenable);

  // 5. 错误处理
  console.log('5) 错误处理：', await errorHandlingDemo());

  // 6. 并发
  console.log('6) 并发四兄弟：');
  await concurrencyDemo();

  // 7. 循环
  console.log('7) 循环中的 await：');
  await loopDemo();

  // 8. async 方法 / 箭头函数
  const client = new ApiClient('https://api.example.com');
  console.log('8) async 方法：', await client.get('/users'));
  console.log('   async 箭头函数：', await asyncArrow(21));

  // 9. 异步迭代器
  console.log('9) 异步迭代：');
  await asyncIteratorDemo();

  // 10. 超时控制
  console.log('10) 超时控制：');
  console.log('   正常任务：', await withTimeout(delay('完成', 20), 100));
  await withTimeout(delay('慢任务', 200), 50).catch((e: Error) =>
    console.log('   超时捕获：', e.message)
  );

  // 11. 并发限流
  console.log('11) 并发限流（limit=2）：');
  const limited = await runWithLimit([1, 2, 3, 4, 5], 2, (n) =>
    delay(n * 10, 20)
  );
  console.log('   ', limited);

  // 12. 顶层 await
  console.log('12) 顶层 await：', topLevelValue);

  // 13. 坑位小结
  console.log('\n13) 常见坑位：');
  console.log('   - forEach(async ...) 不会被外层 await 等待，改用 for...of 或 Promise.all');
  console.log('   - await 放在循环里会串行，独立任务应并发');
  console.log('   - Promise.all 快失败，需要全部结果用 allSettled');
  console.log('   - async 函数内部同步 throw 也会变成 rejected Promise，务必 catch');

  console.log('\n=== 演示结束 ===');
}

main().catch((err) => {
  console.error('未捕获错误：', err);
  process.exitCode = 1;
});
