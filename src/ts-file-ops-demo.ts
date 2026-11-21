/**
 * ============================================================================
 * TypeScript 文件操作（Node.js fs）使用方法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-file-ops-demo.ts
 *
 * 覆盖清单：
 *   1.  准备工作：临时目录与路径处理（node:path）
 *   2.  writeFile / readFile：写入与读取（含编码 utf-8）
 *   3.  appendFile：追加内容
 *   4.  readFile 返回 Buffer：二进制读写与拷贝 copyFile
 *   5.  mkdir / rm / unlink：目录创建、文件删除、目录递归删除
 *   6.  stat / lstat：文件元信息（大小、类型、时间）
 *   7.  readdir：目录遍历（字符串模式 vs Dirent 模式）
 *   8.  rename：重命名与移动
 *   9.  access：存在性判断（替代已废弃的 fs.exists）
 *   10. JSON 读写封装：readJson / writeJson 泛型工具
 *   11. 流式读写：createReadStream / createWriteStream（大文件）
 *   12. 批量处理：Promise.all 并发读 + 错误隔离
 *   13. 常见坑位汇总
 * ============================================================================
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { access, appendFile, copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import * as os from 'node:os';
import * as path from 'node:path';

// ============================================================================
// 1. 准备工作：临时目录与路径处理
//    - 统一用 node:fs/promises 的 Promise API（不要用回调式 fs）
//    - 路径拼接统一用 path.join，跨平台安全
// ============================================================================
/** 演示用的临时根目录，避免污染仓库 */
const WORK_DIR = path.join(os.tmpdir(), 'ts-file-ops-demo');

function demoPath(...segments: string[]): string {
  return path.join(WORK_DIR, ...segments);
}

async function prepare(): Promise<void> {
  // recursive: true —— 目录已存在时不报错，等价于 mkdir -p
  await mkdir(WORK_DIR, { recursive: true });

  console.log('1) 路径处理：');
  console.log('   临时根目录：', WORK_DIR);
  console.log('   join：', path.join('a', 'b', 'c.txt'));
  console.log('   basename / dirname / extname：', {
    basename: path.basename('/tmp/a/b/c.txt'),
    dirname: path.dirname('/tmp/a/b/c.txt'),
    extname: path.extname('/tmp/a/b/c.txt'),
  });
  console.log('   resolve（转为绝对路径）：', path.resolve('apps', 'ts-file-ops-demo.ts'));
  console.log('   isAbsolute：', path.isAbsolute(WORK_DIR));
}

// ============================================================================
// 2. writeFile / readFile：写入与读取
//    - 写入默认会「覆盖」整个文件
//    - 不写编码时 readFile 返回 Buffer，写了 'utf-8' 才返回 string
// ============================================================================
async function readWriteDemo(): Promise<string> {
  const file = demoPath('hello.txt');

  await writeFile(file, '你好，TypeScript！\n第二行内容\n', 'utf-8');

  const text = await readFile(file, 'utf-8');
  console.log('\n2) writeFile / readFile：');
  console.log('   内容：', JSON.stringify(text));
  console.log('   行数：', text.trimEnd().split('\n').length);

  return file;
}

// ============================================================================
// 3. appendFile：追加内容（不覆盖原文件）
// ============================================================================
async function appendDemo(file: string): Promise<void> {
  await appendFile(file, '追加的第三行\n', 'utf-8');
  const text = await readFile(file, 'utf-8');
  console.log('\n3) appendFile 之后：', JSON.stringify(text));
}

// ============================================================================
// 4. 二进制读写：Buffer + copyFile
// ============================================================================
async function binaryDemo(): Promise<void> {
  const src = demoPath('binary.bin');
  const dst = demoPath('binary-copy.bin');

  // 写入二进制：Uint8Array / Buffer 都可以
  const bytes = Buffer.from([0x00, 0x01, 0x02, 0xff]);
  await writeFile(src, bytes);

  // 不传编码 → 读到 Buffer
  const buf = await readFile(src);
  console.log('\n4) 二进制读写：');
  console.log('   是否 Buffer：', Buffer.isBuffer(buf), '长度：', buf.length, '内容：', buf);

  // 直接拷贝，比「读入内存再写出」更省内存
  await copyFile(src, dst);
  console.log('   copyFile 后目标大小：', (await stat(dst)).size);
}

// ============================================================================
// 5. mkdir / rm / unlink：目录与文件的增删
// ============================================================================
async function createRemoveDemo(): Promise<void> {
  const nested = demoPath('a', 'b', 'c');
  await mkdir(nested, { recursive: true });

  const tempFile = path.join(nested, 'temp.txt');
  await writeFile(tempFile, '临时文件', 'utf-8');

  // unlink：删除单个文件
  await rm(tempFile);
  console.log('\n5) unlink 单个文件后仍存在？', await exists(tempFile));

  // rm recursive：删除整棵目录树（危险操作，务必确认路径）
  await rm(demoPath('a'), { recursive: true, force: true });
  console.log('   rm -r 目录后仍存在？', await exists(demoPath('a')));
}

// ============================================================================
// 6. stat / lstat：文件元信息
//    - isFile / isDirectory 判断类型
//    - mtime 是修改时间（Date 对象）
// ============================================================================
async function statDemo(file: string): Promise<void> {
  const info = await stat(file);
  console.log('\n6) stat 元信息：');
  console.log('   大小(byte)：', info.size);
  console.log('   是否文件 / 是否目录：', info.isFile(), info.isDirectory());
  console.log('   修改时间：', info.mtime.toISOString());
}

// ============================================================================
// 7. readdir：目录遍历
//    - 默认返回文件名数组
//    - withFileTypes: true 返回 Dirent，能直接判断文件/目录，省一次 stat
// ============================================================================
async function readdirDemo(): Promise<void> {
  console.log('\n7) readdir 遍历：');

  const names = await readdir(WORK_DIR);
  console.log('   文件名列表：', names);

  const entries = await readdir(WORK_DIR, { withFileTypes: true });
  for (const entry of entries) {
    console.log(`    - ${entry.name} → ${entry.isFile() ? '文件' : entry.isDirectory() ? '目录' : '其他'}`);
  }
}

// ============================================================================
// 8. rename：重命名与移动（同盘内是原子操作）
// ============================================================================
async function renameDemo(): Promise<void> {
  const from = demoPath('hello.txt');
  const to = demoPath('hello-renamed.txt');

  await rename(from, to);
  console.log('\n8) rename：原文件存在？', await exists(from), '新文件存在？', await exists(to));
}

// ============================================================================
// 9. access：存在性判断
//    - fs.exists 已废弃，用 access + try/catch
// ============================================================================
async function exists(target: string): Promise<boolean> {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// 10. JSON 读写封装：泛型工具函数（真实项目里最常用的两个helper）
// ============================================================================
async function readJson<T>(file: string): Promise<T> {
  const text = await readFile(file, 'utf-8');
  return JSON.parse(text) as T;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  // 第二个参数 null 表示不格式化；2 表示缩进两空格，便于人读
  await writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

interface Config {
  name: string;
  version: number;
  features: string[];
}

async function jsonDemo(): Promise<void> {
  const file = demoPath('config.json');
  const config: Config = { name: 'demo', version: 1, features: ['fs', 'path'] };

  await writeJson(file, config);
  const loaded = await readJson<Config>(file);

  console.log('\n10) JSON 读写：');
  console.log('   读回内容：', loaded);
  console.log('   features[0]：', loaded.features[0]);
}

// ============================================================================
// 11. 流式读写：大文件不要一次性读进内存
//    - createReadStream / createWriteStream + pipeline（自动处理背压与错误）
//    - 也支持 for await...of 逐块消费
// ============================================================================
async function streamDemo(): Promise<void> {
  const big = demoPath('big.log');
  const copied = demoPath('big-copy.log');

  // 造一个约 1MB 的文件
  const line = 'x'.repeat(99) + '\n';
  await writeFile(big, line.repeat(10_000), 'utf-8');

  // pipeline：读 → 写，失败时自动销毁两个流
  await pipeline(createReadStream(big), createWriteStream(copied));

  // for await...of：逐块处理（此处统计字符数）
  let total = 0;
  for await (const chunk of createReadStream(big, { encoding: 'utf-8' })) {
    total += chunk.length;
  }

  console.log('\n11) 流式读写：');
  console.log('   pipeline 拷贝后大小：', (await stat(copied)).size);
  console.log('   逐块累计字符数：', total);
}

// ============================================================================
// 12. 批量处理：Promise.all 并发读 + allSettled 错误隔离
//    - 单个文件失败不应拖垮整批 → allSettled
// ============================================================================
async function batchDemo(): Promise<void> {
  const files = ['f1.txt', 'f2.txt', 'missing.txt'];
  await writeFile(demoPath('f1.txt'), 'one', 'utf-8');
  await writeFile(demoPath('f2.txt'), 'two', 'utf-8');

  const results = await Promise.allSettled(
    files.map(async (name) => {
      const text = await readFile(demoPath(name), 'utf-8');
      return `${name}=${text}`;
    })
  );

  console.log('\n12) 批量读取（含一个不存在的文件）：');
  results.forEach((r, i) => {
    const name = files[i] ?? '';
    if (r.status === 'fulfilled') console.log(`    ✅ ${name} → ${r.value}`);
    else console.log(`    ❌ ${name} → ${(r.reason as Error).message.split('\n')[0]}`);
  });

  // 需要「有一个成功就用成功结果」时用 Promise.any；需要「最快的一个」用 Promise.race
  const firstOk = await Promise.any(files.map((n) => readFile(demoPath(n), 'utf-8')));
  console.log('    Promise.any 首个成功值：', JSON.stringify(firstOk));
}

// ============================================================================
// 主流程
// ============================================================================
async function main(): Promise<void> {
  console.log('=== TypeScript 文件操作演示 ===');

  await prepare();
  const hello = await readWriteDemo();
  await appendDemo(hello);
  await binaryDemo();
  await createRemoveDemo();
  await statDemo(hello);
  await readdirDemo();
  await renameDemo();
  await jsonDemo();
  await streamDemo();
  await batchDemo();

  // 13. 常见坑位
  console.log('\n13) 常见坑位：');
  console.log('   - readFile 不传编码返回 Buffer，直接当字符串用会出问题');
  console.log('   - writeFile 是覆盖写，追加请用 appendFile');
  console.log('   - mkdir 不加 recursive 时父目录不存在会抛 ENOENT');
  console.log('   - 判断存在用 access + try/catch，fs.exists 已废弃');
  console.log('   - 大文件不要 readFile 全量读入，用流 + pipeline');
  console.log('   - rm -r 前务必校验路径，避免误删用户目录');
  console.log('   - 并发批量读写用 allSettled，避免一个失败全批崩');

  // 收尾：清理演示目录（force 保证目录不存在也不报错）
  await rm(WORK_DIR, { recursive: true, force: true });
  console.log(`\n已清理临时目录：${WORK_DIR}`);
  console.log('=== 演示结束 ===');
}

main().catch((err) => {
  console.error('未捕获错误：', err);
  process.exitCode = 1;
});
