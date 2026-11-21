/**
 * ============================================================================
 * TypeScript enum（枚举）语法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-enum-demo.ts
 *
 * 覆盖清单：
 *   1.  数字枚举（默认自增、自定义起始值）
 *   2.  字符串枚举
 *   3.  异构枚举（不建议，仅演示）
 *   4.  常量成员与计算成员
 *   5.  反向映射（数字枚举特有）
 *   6.  枚举作为类型 + 联合类型抽取
 *   7.  const enum 编译期内联
 *   8.  环境枚举 declare enum
 *   9.  枚举遍历（Object.keys / values / entries 及数字枚举反向映射的坑）
 *   10. 位标志枚举（bit flags，用 2 的幂表示权限）
 *   11. 枚举 + namespace 合并（给枚举挂静态工具方法）
 *   12. 键 ↔ 值 双向转换的通用工具函数
 *   13. 字符串字面量联合类型 vs 枚举的取舍建议
 * ============================================================================
 */

// ============================================================================
// 1. 数字枚举（默认从 0 自增）
// ============================================================================
enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}

// 自定义起始值：后续成员继续 +1
enum HttpStatus {
  OK = 200,
  Created = 201,
  Accepted = 202,
  NotFound = 404,
  InternalServerError = 500,
}

// ============================================================================
// 2. 字符串枚举（每个成员必须显式初始化，值可读性更好）
// ============================================================================
enum LogLevel {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
}

// ============================================================================
// 3. 异构枚举：混合数字与字符串（强烈不建议，仅演示语法存在）
// ============================================================================
enum Mixed {
  No = 0,
  Yes = 'YES',
}

// ============================================================================
// 4. 常量成员与计算成员
//    - 常量成员：编译期可求值（字面量、引用此前成员、一元/二元运算等）
//    - 计算成员：靠函数调用等运行时求值，必须放在常量成员之后
// ============================================================================
function getLength(s: string): number {
  return s.length;
}

enum FileAccess {
  // 常量成员
  None,
  Read = 1 << 1, // 2，位运算也是常量表达式
  Write = 1 << 2, // 4
  ReadWrite = Read | Write, // 6，引用此前成员

  // 计算成员（必须放在后面）
  KeyLen = getLength('read'),
}

// ============================================================================
// 5. 反向映射：数字枚举可通过值反查键名（字符串枚举不支持）
// ============================================================================
// Direction[0] === 'Up'
// Direction[Direction.Up] === 'Up'

// ============================================================================
// 6. 枚举作为类型 + 用 keyof / typeof 抽取联合类型
// ============================================================================
enum Color {
  Red = '#FF0000',
  Green = '#00FF00',
  Blue = '#0000FF',
}

function paint(c: Color): string {
  return `paint ${c}`;
}

// 抽取“键名联合类型”：'Red' | 'Green' | 'Blue'
type ColorName = keyof typeof Color;

// 抽取“值联合类型”：'#FF0000' | '#00FF00' | '#0000FF'
type ColorValue = `${Color}`;

// ============================================================================
// 7. const enum：编译期直接内联为字面量，产物更小
//    - 优点：无运行时对象，无反向映射，减小体积
//    - 限制：不能用于需要运行时对象 / 反向映射的场景
// ============================================================================
const enum Suit {
  Hearts = 'H',
  Spades = 'S',
  Clubs = 'C',
  Diamonds = 'D',
}

// ============================================================================
// 8. 环境枚举 declare enum：只声明类型、不带运行时定义
//    - 通常来自外部 JS 库或已存在全局变量的场景，仅演示
// ============================================================================
declare enum ExternalFlag {
  On,
  Off,
}

// ============================================================================
// 9. 枚举遍历：注意数字枚举会把“键”和“反向映射的键”一并输出
// ============================================================================
enum SimpleNum {
  A, // 0
  B, // 1
}

// ============================================================================
// 10. 位标志枚举：用 2 的幂表示权限，支持位运算组合
// ============================================================================
enum Permission {
  None = 0,
  Read = 1 << 0, // 1
  Write = 1 << 1, // 2
  Execute = 1 << 2, // 4
  Admin = Read | Write | Execute, // 7
}

function hasPermission(user: number, perm: Permission): boolean {
  return (user & perm) === perm;
}

// ============================================================================
// 11. 枚举 + namespace 合并：给枚举挂静态工具方法
// ============================================================================
enum Weekday {
  Monday = 'MON',
  Tuesday = 'TUE',
  Wednesday = 'WED',
  Thursday = 'THU',
  Friday = 'FRI',
  Saturday = 'SAT',
  Sunday = 'SUN',
}

namespace Weekday {
  // 判断是否为周末
  export function isWeekend(day: Weekday): boolean {
    return day === Weekday.Saturday || day === Weekday.Sunday;
  }

  // 根据字符串值反查枚举成员
  export function fromValue(value: string): Weekday | undefined {
    const entries = Object.entries(Weekday) as [string, Weekday][];
    return entries.find(([, v]) => v === value)?.[1];
  }
}

// ============================================================================
// 12. 键 ↔ 值 双向转换的通用工具函数
// ============================================================================
// 键 -> 值
function enumValue<T extends Record<string, string | number>>(
  enumObj: T,
  key: keyof T
): T[keyof T] {
  return enumObj[key];
}

// 值 -> 键（同时兼容数字枚举的反向映射与字符串枚举）
function enumKey<T extends Record<string, string | number>>(
  enumObj: T,
  value: string | number
): keyof T | undefined {
  const entries = Object.entries(enumObj) as [string, string | number][];
  return entries.find(([k, v]) => v === value && Number.isNaN(Number(k)))?.[0] as
    | keyof T
    | undefined;
}

// ============================================================================
// 13. 字符串字面量联合类型 vs 枚举
//    - 联合类型：零运行时开销、定义简洁，适合轻量场景
//    - 枚举：有命名空间与反向映射、IDE 补全更好，适合需要稳定命名/可遍历时
// ============================================================================
type Status = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// 主函数：集中输出演示结果
// ============================================================================
function main(): void {
  console.log('1) 数字枚举：', Direction.Up, Direction.Down, Direction.Right);
  console.log('   自定义起始值：', HttpStatus.OK, HttpStatus.NotFound);

  console.log('2) 字符串枚举：', LogLevel.Debug, LogLevel.Error);

  console.log('3) 异构枚举：', Mixed.No, Mixed.Yes);

  console.log('4) 常量/计算成员：', {
    Read: FileAccess.Read,
    Write: FileAccess.Write,
    ReadWrite: FileAccess.ReadWrite,
    KeyLen: FileAccess.KeyLen,
  });

  console.log('5) 反向映射：', {
    'Direction[0]': Direction[0],
    'Direction[Direction.Up]': Direction[Direction.Up],
  });

  console.log('6) 枚举作类型 + 联合类型：', paint(Color.Red));
  const colorName: ColorName = 'Green';
  const colorValue: ColorValue = '#0000FF';
  console.log('   keyof typeof 抽取键名：', colorName);
  console.log('   模板字面量抽取值：', colorValue);

  console.log('7) const enum：', Suit.Hearts, Suit.Spades);

  console.log('8) 环境枚举（declare enum）：');
  // declare enum 只在编译期存在类型定义，运行时没有实际对象，
  // 直接访问其值会抛 ReferenceError，因此这里仅演示“类型注解”用法。
  const ext: ExternalFlag = 0; // 编译期可用作类型，值为任意数字
  console.log('   仅作类型使用，运行时不产生对象，变量值：', ext);

  console.log('9) 枚举遍历：');
  console.log('   Object.keys 数字枚举（含反向映射键）：', Object.keys(SimpleNum));
  console.log('   Object.values 数字枚举（含反向映射值）：', Object.values(SimpleNum));
  console.log('   Object.keys 字符串枚举（干净）：', Object.keys(LogLevel));
  console.log('   Object.values 字符串枚举：', Object.values(LogLevel));

  console.log('10) 位标志枚举：');
  const perm = Permission.Read | Permission.Write;
  console.log('   组合权限（Read | Write）：', perm);
  console.log('   判断含 Read：', hasPermission(perm, Permission.Read));
  console.log('   判断含 Execute：', hasPermission(perm, Permission.Execute));
  console.log('   Admin 全量：', Permission.Admin);

  console.log('11) 枚举 + namespace：');
  console.log('   是否周末：', Weekday.isWeekend(Weekday.Saturday));
  console.log('   值反查：', Weekday.fromValue('FRI'));

  console.log('12) 通用双向转换：');
  console.log('   键 -> 值：', enumValue(LogLevel, 'Warn'));
  console.log('   值 -> 键（字符串枚举）：', enumKey(LogLevel, 'ERROR'));
  console.log('   键 -> 值（数字枚举）：', enumValue(Direction, 'Right'));
  console.log('   值 -> 键（数字枚举）：', enumKey(Direction, 2));

  console.log('13) 联合类型示例：');
  const status: Status = 'loading';
  console.log('   当前状态：', status);

  console.log('\n=== 演示结束 ===');
}

main();