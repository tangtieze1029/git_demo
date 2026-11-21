/**
 * ============================================================================
 * TypeScript 系统 API（Node.js os / process / util）使用方法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-system-api-demo.ts
 *
 * 覆盖清单：
 *   1.  node:os    操作系统信息：platform / arch / release / totalmem / freemem
 *   2.  node:os    CPU 与网络：cpus / loadavg / networkInterfaces / uptime
 *   3.  node:os    用户与主机：userInfo / hostname / homedir / tmpdir
 *   4.  node:process 进程基本信息：pid / ppid / version / versions / platform / arch
 *   5.  node:process 命令行与环境：argv / execArgv / env / cwd / chdir
 *   6.  node:process 退出与退出码：exit / exitCode / 'exit' 事件
 *   7.  node:process 信号与生命周期：SIGINT / SIGTERM 优雅退出
 *   8.  node:process 资源与统计：memoryUsage / cpuUsage / uptime / hrtime
 *   9.  node:process 标准流：stdout / stderr / stdin
 *   10. node:util   类型判断与字符串格式化：types / format
 *   11. node:util   promisify：把回调式函数转成 Promise
 *   12. node:util   inherits / inspect / deprecate：继承、调试输出与弃用提示
 *   13. 系统负载 & 内存监控实战组合
 *   14. 常见坑位汇总
 * ============================================================================
 */

import * as os from 'node:os';
import * as util from 'node:util';
import { types as utilTypes } from 'node:util';

// 注意：process 是 Node 全局对象，直接使用即可。
// 不要 `import * as process from 'node:process'`——那会是只读的模块命名空间对象，
// 既不包含 .on/.exit 等方法，也无法给 .exitCode 赋值，容易踩坑。

// ============================================================================
// 1. 操作系统信息
//    - platform：darwin / win32 / linux ...
//    - arch：arm64 / x64 ...
//      注意：os.platform() / os.arch() 与 process.platform / process.arch 结果一致
// ============================================================================
function osInfoDemo(): void {
  console.log('1) 操作系统信息：');
  console.log('   平台 platform：', os.platform());
  console.log('   架构 arch：', os.arch());
  console.log('   系统版本 release：', os.release());
  console.log('   系统类型 type（单词）：', os.type());
  console.log('   版本字符串 version：', os.version());

  // 内存以字节为单位，通常除以 1024^2 转成 MB
  const totalMB = os.totalmem() / 1024 ** 2;
  const freeMB = os.freemem() / 1024 ** 2;
  const usedMB = totalMB - freeMB;
  console.log('   总内存：', totalMB.toFixed(0), 'MB');
  console.log('   空闲内存：', freeMB.toFixed(0), 'MB');
  console.log('   已用内存：', usedMB.toFixed(0), 'MB');
  console.log('   已用占比：', ((usedMB / totalMB) * 100).toFixed(1) + '%');

  // 默认临时目录：桌面判断下载缓存等常见场景
  console.log('   默认临时目录 tmpdir：', os.tmpdir());
}

// ============================================================================
// 2. CPU 与网络
//    - cpus：每个逻辑核的信息（型号 / 频率 MHz / 各态时间）
//    - loadavg：1 / 5 / 15 分钟系统负载均值（Linux/macOS 可用，Windows 恒为 0）
//    - networkInterfaces：网卡地址表（IPv4 / IPv6 / MAC）
//    - uptime：系统开机时长（秒）
// ============================================================================
function cpuNetworkDemo(): void {
  const nCpu = os.cpus().length;
  const cpuModel = os.cpus()[0]?.model ?? 'unknown';
  console.log('\n2) CPU 与网络：');
  console.log('   逻辑 CPU 核数：', nCpu);
  console.log('   首个 CPU 型号：', cpuModel);

  // noUncheckedIndexedAccess 下解构取值是 number | undefined，用解构默认值兜底
  const [l1 = 0, l5 = 0, l15 = 0] = os.loadavg();
  console.log('   负载均值（1/5/15min）：', l1.toFixed(2), l5.toFixed(2), l15.toFixed(2));

  console.log('   系统开机时长：', (os.uptime() / 3600).toFixed(1), '小时');

  const nets = os.networkInterfaces();
  const ifaces = Object.entries(nets)
    .flatMap(([name, addrs]) =>
      (addrs ?? [])
        .filter((a) => a.family === 'IPv4' && !a.internal)
        .map((a) => ({ name, address: a.address, mac: a.mac }))
    );
  console.log('   非内网 IPv4 地址：', ifaces);
}

// ============================================================================
// 3. 用户与主机
//    - userInfo：当前用户信息（用户名 / home 目录 / uid / gid）
//    - hostname：主机名
//    - homedir：用户家目录
// ============================================================================
function userHostDemo(): void {
  console.log('\n3) 用户与主机：');
  const info = os.userInfo(); // 平台差异：Windows 上 uid/gid 为 -1
  console.log('   当前用户：', info.username);
  console.log('   家目录：', info.homedir);
  console.log('   uid / gid：', info.uid, info.gid);
  console.log('   主机名：', os.hostname());
  console.log('   homedir 是否等于 userInfo.homedir：', os.homedir() === info.homedir);
}

// ============================================================================
// 4. 进程基本信息
//    - pid：本进程 ID；ppid：父进程 ID
//    - version：Node 版本字符串；versions：各依赖版本明细
//    - platform / arch：进程运行的平台与架构（与 os 模块一致）
//    - execPath：Node 可执行文件路径
// ============================================================================
function processInfoDemo(): void {
  console.log('\n4) 进程基本信息：');
  console.log('   pid：', process.pid, ' ppid：', process.ppid);
  console.log('   node 版本：', process.version);
  console.log('   platform / arch：', process.platform, process.arch);
  console.log('   可执行文件路径 execPath：', process.execPath);
  console.log('   versions 关键项：', {
    node: process.versions.node,
    v8: process.versions.v8,
    uv: process.versions.uv,
  });
}

// ============================================================================
// 5. 命令行与环境
//    - argv：命令行参数数组（argv[0]=node，argv[1]=脚本路径，之后是用户参数）
//    - execArgv：传给 node 本身的参数（如 --loader、--inspect）
//    - env：环境变量对象（值全部是字符串）
//    - cwd / chdir：获取 / 切换当前工作目录
// ============================================================================
function processEnvDemo(): void {
  console.log('\n5) 命令行与环境：');
  console.log('   argv：', process.argv.slice(0, 3), '（加 --xxx 可传参）');
  console.log('   execArgv（node 自身参数）：', process.execArgv);
  console.log('   cwd（当前工作目录）：', process.cwd());

  // 环境变量常用场景：读取配置，自定义默认值
  const envMode = process.env.MY_MODE ?? 'development';
  console.log('   读取环境变量 MY_MODE（默认 development）：', envMode);

  // 判断运行环境
  const isProd = process.env.NODE_ENV === 'production';
  console.log('   NODE_ENV 是否 production：', isProd);
}

// ============================================================================
// 6. 退出与退出码
//    - exitCode：推荐的设置退出码方式（进程自然结束后生效）
//    - exit：立即退出（推荐传退出码；不推荐在退出事件里做同步清理之外的复杂逻辑）
//    - 'exit' 事件：进程即将退出时同步回调，只能做同步操作
// ============================================================================
function exitCodeDemo(): void {
  console.log('\n6) 退出码演示（本段不真正退出）：');

  // 注册 exit 事件：进程结束时触发（同步回调）
  process.on('exit', (code) => {
    console.log(`   [exit 事件] 即将退出，退出码 = ${code}`);
  });

  // 设置"进程结束时应使用的退出码"——不会立即退出
  process.exitCode = 0;
  console.log('   exitCode 已设置为 0（标记正常结束）');

  console.log('   注意：process.exit() 会立即终止，之后的代码不再执行；');
  console.log('          异步任务（Promise）也可能来不及完成，生产中慎用。');
}

// ============================================================================
// 7. 信号与生命周期：优雅退出
//    - SIGINT：Ctrl+C；SIGTERM：kill 默认信号
//    - 业务场景：收到退出信号先做清理（关数据库、落盘、告警），再退出
// ============================================================================
function gracefulShutdownDemo(): void {
  console.log('\n7) 优雅退出（不在此触发，仅演示注册方式）：');

  const shutdown = (signal: NodeJS.Signals): void => {
    console.log(`   收到信号 ${signal}，执行清理...`);
    // 真实项目：await 关闭数据库连接 / flush 日志等
    process.exitCode = 0;
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  console.log('   已注册 SIGINT / SIGTERM 处理——真实服务中收到信号会先清理再退出。');
}

// ============================================================================
// 8. 资源与统计
//    - memoryUsage：rss / heapTotal / heapUsed / external（单位字节）
//    - cpuUsage：本进程 CPU 用户态 / 内核态耗时（微秒）
//    - hrtime：高精度时间差测量（纳秒级），性能计时的推荐方式
//    - process.uptime：本进程已运行秒数（区别于 os.uptime 系统开机时长）
// ============================================================================
function perfAndMemoryDemo(): void {
  console.log('\n8) 资源与统计：');

  const mem = process.memoryUsage();
  console.log('   memoryUsage.rss（物理内存）：', (mem.rss / 1024 ** 2).toFixed(1), 'MB');
  console.log('   memoryUsage.heapUsed（堆使用）：', (mem.heapUsed / 1024 ** 2).toFixed(1), 'MB');

  const cpu = process.cpuUsage();
  console.log('   本进程 cpuUsage：user', (cpu.user / 1000).toFixed(1), 'ms / system', (cpu.system / 1000).toFixed(1), 'ms');

  // hrtime：高精度测量代码耗时
  const start = process.hrtime.bigint();
  let sum = 0;
  for (let i = 0; i < 1_000_000; i++) sum += i;
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  console.log('   hrtime 测 100 万次循环耗时：', elapsedMs.toFixed(3), 'ms');

  console.log('   本进程已运行 uptime：', process.uptime().toFixed(1), '秒');
}

// ============================================================================
// 9. 标准流
//    - stdout / stderr：同步写（避免与异步日志交错）
//    - stdin：标准输入（流式读取）
//    - 常用：日志分级（正常 → stdout，错误 → stderr）
// ============================================================================
function stdioDemo(): void {
  console.log('\n9) 标准流：');

  // 错误信息写 stderr，便于重定向时分离
  process.stdout.write('   [stdout] 正常日志\n');
  process.stderr.write('   [stderr] 错误日志（重定向时与 stdout 分离）\n');
  console.log('   stdin 可读 / 是否 TTY（交互终端）：', process.stdin.isTTY);
}

// ============================================================================
// 10. util.types 类型判断 + util.format 字符串格式化
//     - types.isXxx：更精确的类型判断（比 typeof / instanceof 更可靠）
//     - format：printf 风格格式化（%s %d %j %o），也可直接拼接对象
// ============================================================================
function utilTypesFormatDemo(): void {
  console.log('\n10) util 类型判断与格式化：');
  const arr = new Uint8Array(4);
  const buf = Buffer.from('hi');
  const set = new Set([1, 2]);
  const p = Promise.resolve();
  console.log('   Uint8Array 判断（Buffer 也属于 Uint8Array）：',
    utilTypes.isUint8Array(arr), utilTypes.isUint8Array(buf));
  console.log('   isSet / isPromise / isRegExp：',
    utilTypes.isSet(set), utilTypes.isPromise(p), utilTypes.isRegExp(/a/));
  console.log('   isDate / isNativeError / isTypedArray：',
    utilTypes.isDate(new Date()), utilTypes.isNativeError(new Error()), utilTypes.isTypedArray(arr));

  // format：%s 字符串、%d 数字、%j JSON、%o 对象（自动格式化）
  console.log('   format("%s-%d-%j")：', util.format('用户%s 分数%d 数据%j', 'Tom', 98, { tag: 'a' }));
  const inject = { name: 'node', v: 'v24' };
  console.log('   format("%o") 对象：', util.format('%o', inject));
}

// ============================================================================
// 11. util.promisify：回调式 → Promise
//     - 适用于 Node 内置或三方库中"最后一个参数是回调"的函数
//     - Node 内置模块多数已有 /promises 版本，此写法主要用于三方回调库
// ============================================================================
async function promisifyDemo(): Promise<void> {
  console.log('\n11) promisify（回调转 Promise）：');

  // 模拟一个回调式函数：callback(err, result)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function callbackStyle(delayMs: number, cb: (err: Error | null, result?: string) => void): void {
    if (delayMs < 0) {
      // 非法参数直接回调错误，避免 setTimeout 负值（会触发 TimeoutNegativeWarning）
      cb(new Error('非法 delay'));
      return;
    }
    setTimeout(() => {
      cb(null, `耗时 ${delayMs}ms`);
    }, delayMs);
  }

  // 约定最后一个参数是回调（err-first）即可被 promisify
  const promiseStyle = util.promisify(callbackStyle) as (ms: number) => Promise<string>;

  // 这里 await 落定，保证结果在"本段"内输出，而不是排在演示结束之后
  const ok = await promiseStyle(10);
  console.log('   promisify 成功：', ok);

  try {
    await promiseStyle(-1);
    console.log('   （不应走到这里）');
  } catch (e) {
    console.log('   promisify 捕获错误：', (e as Error).message);
  }
}

// ============================================================================
// 12. util inherits / inspect / deprecate
//     - inherits：ES5 时代构造函数继承的兼容写法（新代码建议直接用 class extends）
//     - inspect：深度打印对象（比 console.log 更可控，可控制层级/颜色/字典序）
//     - deprecate：给已弃用 API 打"DeprecationWarning"警告
// ============================================================================
function utilInheritInspectDemo(): void {
  console.log('\n12) util 继承 / 调试 / 弃用：');

  // deprecate：包装一个即将废弃的函数，调用时打印警告
  const oldApi = util.deprecate((n: number) => n * 2, 'oldApi() 已废弃，请改用 newApi()');
  console.log('   deprecate 调用结果（会有 Warning 输出）：', oldApi(21));

  // inspect：深度格式化嵌套对象
  const nested = { name: 'config', deep: { arr: [1, 2, { ok: true }], nums: new Map([['a', 1]]) } };
  const printed = util.inspect(nested, { depth: 4, colors: false, sorted: true });
  console.log('   inspect 深度打印：\n', printed);

  // inherits 仅作兼容性演示（ES5 构造函数），新代码直接 class extends 即可
  interface AnimalLike { kind: string; }
  function Animal(this: AnimalLike): void {
    this.kind = 'animal';
  }
  function Dog(this: AnimalLike & { breed: string }): void {
    Animal.call(this);
    this.breed = 'husky';
  }
  util.inherits(Dog, Animal);
  const dog = new (Dog as unknown as new () => AnimalLike & { breed: string })();
  console.log('   inherits 后实例属性：', dog.kind, '的', dog.breed);
}

// ============================================================================
// 13. 系统负载 & 内存监控实战组合
//     - 组合 os + process，输出"一键体检"信息，可挂到监控/运维脚本
// ============================================================================
function systemHealthDemo(): void {
  console.log('\n13) 系统体检组合：');

  const totalMB = os.totalmem() / 1024 ** 2;
  const freeMB = os.freemem() / 1024 ** 2;
  const [l1 = 0] = os.loadavg();
  const heapUsedMB = process.memoryUsage().heapUsed / 1024 ** 2;

  const memoryPressure = freeMB / totalMB < 0.2 ? '偏高' : '正常';
  const loadPressure = l1 > os.cpus().length ? '偏高(超过核数)' : '正常';

  console.log('   内存：已用', ((1 - freeMB / totalMB) * 100).toFixed(1) + '%',
    `（空闲比例 ${memoryPressure}）`);
  console.log('   1min 负载：', l1.toFixed(2), `（${loadPressure}）`);
  console.log('   本进程堆占用：', heapUsedMB.toFixed(1), 'MB');
  console.log('   物理核数：', os.cpus().length, '  主机名：', os.hostname());
}

// ============================================================================
// 主流程：集中输出演示结果
// ============================================================================
async function main(): Promise<void> {
  console.log('=== TypeScript 系统 API（os / process / util）演示 ===\n');

  osInfoDemo();
  cpuNetworkDemo();
  userHostDemo();
  processInfoDemo();
  processEnvDemo();
  exitCodeDemo();
  gracefulShutdownDemo();
  perfAndMemoryDemo();
  stdioDemo();
  utilTypesFormatDemo();
  await promisifyDemo();
  utilInheritInspectDemo();
  systemHealthDemo();

  // 14. 常见坑位
  console.log('\n14) 常见坑位：');
  console.log('   - 内存相关 API 返回字节，展示前除以 1024^2 转成 MB，直接打印会被逗号分隔难读');
  console.log('   - os.platform() 与 process.platform 一致，别两处维护；Windows 判断多用 process.platform === "win32"');
  console.log('   - os.loadavg() 在 Windows 上恒为 0，跨平台脚本勿依赖其数值');
  console.log('   - process.exit() 会立即结束进程，可能截断未完成的异步任务，优先用 process.exitCode');
  console.log('   - 判断 Uint8Array 用 util.types.isUint8Array：Buffer 也是 Uint8Array，typeof 判断会失准');
  console.log('   - Node 内置 fs/child_process 已提供 /promises 版本，优先使用，不必 promisify');
  console.log('   - 读取大文件/大量输出时优先流式处理（stdout 用 write 而非 console.log 避免对象过度格式化）');

  console.log('\n=== 演示结束 ===');
}

main().catch((err) => {
  console.error('未捕获错误：', err);
  process.exitCode = 1;
});
