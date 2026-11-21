/// <reference types="node" />
/**
 * ============================================================================
 * TypeScript 注释指令全演示（注释 / JSDoc / 三斜线 / 编译指令 / 工具指令）
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-comment-directives-demo.ts
 *
 * 类型校验：
 *   npx tsc --noEmit apps/ts-comment-directives-demo.ts
 *
 * 覆盖清单：
 *   1.  单行注释与块注释（普通说明性注释）
 *   2.  JSDoc 注释：@param / @returns / @throws / @example / @see / @deprecated
 *   3.  JSDoc 泛型标注：@template 与 @typeParam
 *   4.  JSDoc 内部标记：@internal / @link
 *   5.  三斜线指令：/// <reference types|path|lib />
 *   6.  编译指令：// @ts-ignore（静默忽略，不校验是否存在错误）
 *   7.  编译指令：// @ts-expect-error（断言必然出错，错误消失反而报错）
 *   8.  文件级指令：// @ts-nocheck 与 // @ts-check（本文件不启用，仅说明）
 *   9.  工具指令：eslint-disable / prettier-ignore / PURE 标记 / v8 ignore
 *   10. 编辑器折叠标记：//#region 与 //#endregion
 *   11. 指令对比表与使用建议
 * ============================================================================
 */

// ============================================================================
// 1. 普通注释
//    - 单行注释：// 后面的内容被编译器完全丢弃
//    - 块注释：/* ... */ 可跨行；注意不要与正则字面量混淆
//    - 注释不参与类型检查，也不会出现在 .d.ts 里
// ============================================================================
// 这是单行注释，用于解释下面这一行的意图
const maxRetry = 3;

/* 这是块注释，
   可以写多行说明 */
const timeoutMs = 5000;

// ============================================================================
// 2. JSDoc 注释：以 /** 开头、*/ 结尾
//    - 编辑器悬停提示、参数签名、代码补全全部来自 JSDoc
//    - @deprecated 会让调用处出现删除线
//    - @throws 不被编译器校验，仅是文档约定
// ============================================================================

/**
 * 按用户 id 计算折扣。
 *
 * @param userId 用户唯一标识，不能为空字符串
 * @param amount 原价，单位：分
 * @returns 折后价格（单位：分，向下取整）
 * @throws 当 userId 为空或 amount 为负数时抛出 Error
 * @example
 * ```ts
 * calcDiscount('u_1', 10000); // 9000
 * ```
 * @see {@link maxRetry} 重试次数上限
 */
function calcDiscount(userId: string, amount: number): number {
  if (!userId) throw new Error('userId 不能为空');
  if (amount < 0) throw new Error('amount 不能为负数');

  return Math.floor(amount * 0.9);
}

/**
 * 旧版价格格式化。调用处会显示删除线，提示迁移。
 *
 * @deprecated 请改用 {@link calcDiscount}，本函数将在下一个大版本移除
 */
function formatPriceLegacy(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

// ============================================================================
// 3. JSDoc 泛型标注
//    - @template T 与 TypeScript 的 <T> 等价，@typeParam 是别名写法
//    - 只是文档，真正的约束仍由类型参数表达
// ============================================================================

/**
 * 取数组首元素。
 *
 * @template T 元素类型
 * @typeParam K 备用别名，等价于 @template
 * @param list 源数组
 * @returns 首元素；空数组返回 undefined
 */
function first<T>(list: readonly T[]): T | undefined {
  return list[0];
}

// ============================================================================
// 4. JSDoc 内部标记
//    - @internal 配合 stripInternal 编译选项，可从 .d.ts 中剔除该声明
//    - {@link Xxx} 生成可跳转的文档链接
// ============================================================================

/** @internal 仅内部使用，不应出现在对外声明文件中 */
let internalCounter = 0;

// ============================================================================
// 5. 三斜线指令
//    - 必须位于文件最顶部（本行以上只能有其他注释/指令），否则完全失效
//    - /// <reference types="node" />    引入 @types 包
//    - /// <reference path="./a.d.ts" /> 引入相对路径声明文件
//    - /// <reference lib="dom" />       引入内置 lib
//    - /// <reference no-default-lib="true" /> 禁用默认 lib（极特殊场景）
//    本文件第 1 行即使用了 types 形式，下面只在注释里说明另外两种。
// ============================================================================
const platform: string = `${process.platform} / ${process.version}`;

// ============================================================================
// 6. @ts-ignore：静默忽略下一行的所有类型错误
//    - 不校验“下一行是否真的有错误”，写错了也照样放行
//    - 容易留下过期无用的“僵尸注释”，新代码应优先用 @ts-expect-error
// ============================================================================

function tsIgnoreDemo(): void {
  console.log('6) @ts-ignore');

  // @ts-ignore 已知此处类型不合法，但出于历史原因先放行
  const count: number = 'not-a-number';

  console.log('   运行时仍会执行，值类型为：', typeof count);
}

// ============================================================================
// 7. @ts-expect-error：断言下一行必然存在类型错误
//    - 如果下一行没有错误，编译器反而会报 “Unused '@ts-expect-error' directive”
//    - 因此它天然具备“错误消失即提醒删除注释”的自净能力
//    - 常用于类型测试（期望某写法不被类型系统接受）
// ============================================================================

interface Tester {
  name: string;
}

function tsExpectErrorDemo(): void {
  console.log('7) @ts-expect-error');

  // @ts-expect-error 用例 1：字符串不能赋给 number
  const expectFail: number = 'x';

  const tester: Tester = { name: 'tom' };

  // @ts-expect-error 用例 2：访问不存在的属性会报 TS2339
  const age = tester.age;

  console.log('   两条预期错误均已按断言被抑制：', typeof expectFail, age);
}

// ============================================================================
// 8. 文件级指令（本文件刻意不启用，否则整份演示将失去类型检查）
//    - // @ts-nocheck  放在文件首行：整个文件跳过类型检查（迁移旧文件过渡用）
//    - // @ts-check    放在 .js 文件首行：为该 JS 文件开启类型检查
//    - 二者只对文件顶部有效，写在代码中间不生效
// ============================================================================

// ============================================================================
// 9. 工具链指令（不是 TypeScript 官方指令，由 lint / 打包 / 覆盖率工具识别）
//    - // eslint-disable-next-line 规则名   跳过下一行的 lint 规则
//    - /* eslint-disable */                跳过整个文件（慎用）
//    - // prettier-ignore                  让格式化工具保留手动排版
//    - /*#__PURE__*/                       告诉打包器“该调用无副作用，可摇树”
//    - // v8 ignore next                   让覆盖率忽略下一行
// ============================================================================

/** 纯函数：仅用于演示 PURE 标记（见下方 unusedGreeting 一行） */
function createGreeting(name: string): { text: string } {
  return { text: `hi ${name}` };
}

// prettier-ignore
const matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const unusedGreeting = /*#__PURE__*/ createGreeting('tom');

function toolchainDirectivesDemo(): void {
  console.log('\n9) 工具链指令（lint / 打包 / 覆盖率工具识别）');
  // eslint-disable-next-line no-console
  console.log('   prettier-ignore 保留的矩阵行数：', matrix.length);
  console.log('   PURE 标记的调用结果：', unusedGreeting.text);
}

// ============================================================================
// 10. 编辑器折叠标记
//     - //#region 名称 与 //#endregion 让 VS Code 支持手动折叠代码块
//     - 项目里已有文件用 “===” 分隔线，两者可以并存
// ============================================================================
//#region 折叠示例
const regionA = 1;
const regionB = 2;
//#endregion

// ============================================================================
// 11. 指令对比表
// ============================================================================
function printCheatsheet(): void {
  const rows: Array<[string, string, string]> = [
    ['// 注释', '编译器丢弃', '纯说明，不产生任何语义'],
    ['/** JSDoc */', '进入编辑器提示/可生成 d.ts', '文档与签名提示的首选'],
    ['/// <reference />', '文件首行有效', '声明依赖的类型来源'],
    ['// @ts-ignore', '忽略下一行错误，不校验', '遗留代码过渡，易失效'],
    ['// @ts-expect-error', '断言下一行必错，不错则报错', '类型测试 / 强约束抑制'],
    ['// @ts-nocheck', '整个文件不检查', '老文件迁移临时手段'],
    ['// @ts-check', '.js 文件开启检查', '渐进式类型化'],
    ['// eslint-disable-*', 'lint 工具识别', '局部豁免规则，需写明原因'],
    ['/*#__PURE__*/', '打包器识别', '辅助 tree-shaking'],
    ['//#region', '编辑器识别', '代码折叠，无运行时语义'],
  ];

  console.log('\n11) 注释指令对比表');
  for (const [directive, effect, advice] of rows) {
    console.log(`   ${directive.padEnd(22)} | ${effect.padEnd(26)} | ${advice}`);
  }
}

// ============================================================================
// 主流程
// ============================================================================
function main(): void {
  console.log('=== TypeScript 注释指令演示 ===');

  console.log('\n1) 普通单行 / 块注释');
  console.log('   maxRetry =', maxRetry, ' timeoutMs =', timeoutMs);

  console.log('\n2) JSDoc');
  console.log('   折扣计算结果：', calcDiscount('u_1', 10000));
  console.log('   旧函数仍可调用：', formatPriceLegacy(10000));

  console.log('\n3) 泛型 JSDoc');
  console.log('   first([1,2,3]) =', first([1, 2, 3]));

  console.log('\n4) @internal');
  console.log('   内部计数器：', ++internalCounter);

  console.log('\n5) 三斜线 reference（文件第 1 行生效）：', platform);

  tsIgnoreDemo();
  tsExpectErrorDemo();

  console.log('\n8) 文件级指令（本文件未启用，仅说明）');
  console.log('   // @ts-nocheck 跳过整文件；// @ts-check 为 .js 开启检查');

  toolchainDirectivesDemo();

  console.log('\n10) 折叠区块变量：', regionA + regionB);

  printCheatsheet();
  console.log('\n=== 演示结束 ===');
}

main();
