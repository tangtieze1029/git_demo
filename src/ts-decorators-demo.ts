/**
 * ============================================================================
 * TypeScript 装饰器演示（TC39 标准装饰器，TypeScript 5+）
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-decorators-demo.ts
 *
 * 当前 tsconfig 未开启 experimentalDecorators，因此本文件使用标准装饰器。
 * 注意：标准装饰器目前不支持参数装饰器。
 *
 * 覆盖清单：
 *   1. 方法装饰器：记录调用、返回值和异常
 *   2. 装饰器工厂：通过参数定制装饰器
 *   3. 字段装饰器：转换字段初始值
 *   4. 自动访问器装饰器：拦截读取之外的初始化与赋值
 *   5. getter 装饰器：按实例缓存计算结果
 *   6. 类装饰器：注册类元数据
 * ============================================================================
 */

// ============================================================================
// 1. 方法装饰器
//    target 是原方法，context 提供方法名、静态/私有属性及初始化能力。
//    返回一个新函数即可替换原方法，并通过 apply 保留 this 与参数类型。
// ============================================================================
function log<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return {
  const methodName = String(context.name);

  return function (this: This, ...args: Args): Return {
    console.log(`   [log] 调用 ${methodName}，参数：`, args);

    try {
      const result = target.apply(this, args);
      console.log(`   [log] ${methodName} 返回：`, result);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : error;
      console.log(`   [log] ${methodName} 抛错：`, message);
      throw error;
    }
  };
}

class Calculator {
  @log
  add(left: number, right: number): number {
    return left + right;
  }

  @log
  divide(dividend: number, divisor: number): number {
    if (divisor === 0) throw new Error('除数不能为 0');
    return dividend / divisor;
  }
}

// ============================================================================
// 2. 装饰器工厂
//    @deprecated('...') 先执行工厂得到装饰器，再把装饰器应用到方法上。
// ============================================================================
function deprecated(message: string) {
  return function <This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
  ): (this: This, ...args: Args) => Return {
    return function (this: This, ...args: Args): Return {
      console.warn(`   [deprecated] ${String(context.name)}：${message}`);
      return target.apply(this, args);
    };
  };
}

class UserService {
  @deprecated('请改用 getDisplayName()')
  getName(name: string): string {
    return name;
  }

  getDisplayName(name: string): string {
    return `用户：${name}`;
  }
}

// ============================================================================
// 3. 字段装饰器
//    字段装饰器的 target 为 undefined，返回的函数只处理“字段初始值”。
//    后续直接赋值不会经过该函数；需要持续拦截赋值时请使用 accessor。
// ============================================================================
function uppercase<This>(
  _target: undefined,
  context: ClassFieldDecoratorContext<This, string>,
): (this: This, value: string) => string {
  return function (this: This, value: string): string {
    const normalized = value.trim().toUpperCase();
    console.log(`   [uppercase] ${String(context.name)}：${JSON.stringify(value)} -> ${normalized}`);
    return normalized;
  };
}

class UserProfile {
  @uppercase
  code = '  ab-001  ';
}

// ============================================================================
// 4. 自动访问器（auto-accessor）装饰器
//    accessor 会生成带私有存储的 get/set；装饰器可通过 init/set 校验值。
// ============================================================================
function positive<This>(
  target: ClassAccessorDecoratorTarget<This, number>,
  context: ClassAccessorDecoratorContext<This, number>,
): ClassAccessorDecoratorResult<This, number> {
  function validate(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${String(context.name)} 必须是非负有限数字`);
    }
    return value;
  }

  return {
    init(value: number): number {
      return validate(value);
    },
    set(value: number): void {
      target.set.call(this, validate(value));
    },
  };
}

class Account {
  @positive
  accessor balance = 100;
}

// ============================================================================
// 5. getter 装饰器
//    WeakMap 让每个实例拥有独立缓存，且不会阻止实例被垃圾回收。
// ============================================================================
function memoize<This extends object, Return>(
  target: (this: This) => Return,
  context: ClassGetterDecoratorContext<This, Return>,
): (this: This) => Return {
  const cache = new WeakMap<This, { value: Return }>();

  return function (this: This): Return {
    const cached = cache.get(this);
    if (cached !== undefined) {
      console.log(`   [memoize] ${String(context.name)} 命中缓存`);
      return cached.value;
    }

    console.log(`   [memoize] ${String(context.name)} 执行计算`);
    const value = target.call(this);
    cache.set(this, { value });
    return value;
  };
}

class Rectangle {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  @memoize
  get area(): number {
    return this.width * this.height;
  }
}

// ============================================================================
// 6. 类装饰器
//    target 是类本身；可以返回新类替换它，也可以像这里一样只注册元数据。
// ============================================================================
type AnyConstructor = abstract new (...args: never[]) => unknown;
const classRegistry = new Map<string, AnyConstructor>();

function register<Class extends AnyConstructor>(
  target: Class,
  context: ClassDecoratorContext<Class>,
): void {
  classRegistry.set(context.name ?? 'anonymous', target);
}

@register
class RegisteredService {
  ping(): string {
    return 'pong';
  }
}

// ============================================================================
// 运行验证
// ============================================================================
function main(): void {
  console.log('=== TypeScript 标准装饰器演示 ===\n');

  console.log('1) 方法装饰器：');
  const calculator = new Calculator();
  console.log('   add 结果：', calculator.add(2, 3));
  try {
    calculator.divide(10, 0);
  } catch {
    console.log('   已捕获 divide 抛出的除零错误');
  }

  console.log('\n2) 装饰器工厂：');
  const service = new UserService();
  console.log('   旧方法结果：', service.getName('Alice'));
  console.log('   新方法结果：', service.getDisplayName('Alice'));

  console.log('\n3) 字段装饰器：');
  const profile = new UserProfile();
  console.log('   初始化后：', profile.code);
  profile.code = '  xy-002  ';
  console.log('   后续赋值不经过字段装饰器：', JSON.stringify(profile.code));

  console.log('\n4) 自动访问器装饰器：');
  const account = new Account();
  account.balance = 200;
  console.log('   合法赋值后：', account.balance);
  try {
    account.balance = -1;
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      console.log('   非法赋值被拦截：', error.message);
    }
  }
  console.log('   非法赋值后仍为：', account.balance);

  console.log('\n5) getter 装饰器：');
  const rectangle = new Rectangle(10, 5);
  console.log('   第一次读取 area：', rectangle.area);
  console.log('   第二次读取 area：', rectangle.area);

  console.log('\n6) 类装饰器：');
  console.log('   已注册的类：', Array.from(classRegistry.keys()));
  console.log('   被装饰的类仍可正常使用：', new RegisteredService().ping());

  console.log('\n=== 演示结束 ===');
}

main();
