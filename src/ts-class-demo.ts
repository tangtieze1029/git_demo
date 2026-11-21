/**
 * ============================================================================
 * TypeScript class（类）语法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-class-demo.ts
 *
 * 覆盖清单：
 *   1.  基础类与构造函数
 *   2.  访问修饰符 public / private / protected
 *   3.  只读属性 readonly
 *   4.  参数属性（constructor 参数上直接声明成员）
 *   5.  getter / setter
 *   6.  静态属性与方法 static
 *   7.  继承 extends 与 super
 *   8.  抽象类 abstract
 *   9.  实现接口 implements
 *   10. 泛型类
 *   11. ES 私有字段 #field
 *   12. 方法重写与 protected 成员
 * ============================================================================
 */

// ============================================================================
// 1. 基础类与构造函数
// ============================================================================
class Animal {
  // 显式声明成员（不缩写）
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  move(distance = 0): string {
    return `${this.name} moved ${distance}m`;
  }
}

// ============================================================================
// 2. 访问修饰符 public / private / protected
// ============================================================================
class BankAccount {
  // public：默认，类内外均可访问
  public owner: string;

  // private：仅类内部可访问
  private _balance: number;

  // protected：类内部及子类可访问
  protected currency: string;

  constructor(owner: string, balance: number, currency = 'CNY') {
    this.owner = owner;
    this._balance = balance;
    this.currency = currency;
  }

  // 通过公共方法暴露私有字段
  getBalance(): string {
    return `${this._balance} ${this.currency}`;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('存款金额必须大于 0');
    this._balance += amount;
  }
}

// ============================================================================
// 3. 只读属性 readonly
// ============================================================================
class Vehicle {
  readonly vin: string; // 初始化后不可重新赋值
  readonly wheels: number = 4; // 声明时直接初始化

  constructor(vin: string) {
    this.vin = vin;
  }
}

// ============================================================================
// 4. 参数属性：在构造函数参数上直接写访问修饰符，自动成为成员
// ============================================================================
class User {
  constructor(
    public id: number,
    public name: string,
    private password: string,
    public readonly createdAt: Date = new Date()
  ) {}

  checkPassword(input: string): boolean {
    return this.password === input;
  }
}

// ============================================================================
// 5. getter / setter
// ============================================================================
class Temperature {
  private _celsius = 0;

  get celsius(): number {
    return this._celsius;
  }

  set celsius(value: number) {
    this._celsius = value;
  }

  // 派生 getter
  get fahrenheit(): number {
    return this._celsius * 1.8 + 32;
  }

  set fahrenheit(value: number) {
    this._celsius = (value - 32) / 1.8;
  }
}

// ============================================================================
// 6. 静态属性与方法 static
// ============================================================================
class MathUtils {
  static readonly PI = 3.1415926535;

  static circleArea(radius: number): number {
    return MathUtils.PI * radius ** 2;
  }

  static instances = 0;
}

// ============================================================================
// 7. 继承 extends 与 super
// ============================================================================
class Dog extends Animal {
  breed: string;

  constructor(name: string, age: number, breed: string) {
    super(name, age); // 调用父类构造函数
    this.breed = breed;
  }

  // 重写父类方法
  move(distance = 0): string {
    return `${this.name} the ${this.breed} ran ${distance}m`;
  }

  bark(): string {
    return `${this.name} says woof!`;
  }
}

// ============================================================================
// 8. 抽象类 abstract
// ============================================================================
abstract class Shape {
  abstract getArea(): number;

  describe(): string {
    return `This shape has an area of ${this.getArea()}`;
  }
}

class Rectangle extends Shape {
  constructor(public width: number, public height: number) {
    super();
  }

  getArea(): number {
    return this.width * this.height;
  }
}

class Circle extends Shape {
  constructor(public radius: number) {
    super();
  }

  getArea(): number {
    return MathUtils.PI * this.radius ** 2;
  }
}

// ============================================================================
// 9. 实现接口 implements
// ============================================================================
interface Logger {
  log(message: string): void;
  getLogs(): string[];
}

class ConsoleLogger implements Logger {
  private logs: string[] = [];

  log(message: string): void {
    const entry = `[${new Date().toISOString()}] ${message}`;
    this.logs.push(entry);
    console.log(entry);
  }

  getLogs(): string[] {
    return this.logs;
  }
}

// ============================================================================
// 10. 泛型类
// ============================================================================
class Cache<T> {
  private store = new Map<string, T>();

  set(key: string, value: T): void {
    this.store.set(key, value);
  }

  get(key: string): T | undefined {
    return this.store.get(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}

// ============================================================================
// 11. ES 私有字段 #field（运行时的真正私有，不依赖 TS 编译）
// ============================================================================
class SecureBox {
  #secret: string;

  constructor(secret: string) {
    this.#secret = secret;
  }

  reveal(password: string): string | null {
    if (password === 'admin') return this.#secret;
    return null;
  }
}

// ============================================================================
// 12. protected 构造函数：单例模式示例
// ============================================================================
class Database {
  private static instance?: Database;

  protected constructor(public connectionString: string) {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database('postgres://localhost/db');
    }
    return Database.instance;
  }

  query(sql: string): string {
    return `Executing: ${sql}`;
  }
}

// ============================================================================
// 运行验证
// ============================================================================
function main(): void {
  console.log('=== TypeScript class 语法全演示 ===\n');

  // 1. 基础类
  const animal = new Animal('Leo', 5);
  console.log('1) 基础类：', animal.move(10));

  // 2. 访问修饰符
  const account = new BankAccount('Alice', 1000);
  console.log('2) 访问修饰符：', account.owner, account.getBalance());
  account.deposit(500);
  console.log('   存款后：', account.getBalance());

  // 3. readonly
  const car = new Vehicle('VIN123456');
  console.log('3) 只读属性：', car.vin, car.wheels);
  // car.vin = 'xxx'; // 编译错误：无法分配到 "vin" ，因为它是只读属性

  // 4. 参数属性
  const user = new User(1, 'Bob', 'secret123');
  console.log('4) 参数属性：', user.id, user.name, user.checkPassword('secret123'));

  // 5. getter / setter
  const temp = new Temperature();
  temp.celsius = 100;
  console.log('5) getter/setter：', { celsius: temp.celsius, fahrenheit: temp.fahrenheit });
  temp.fahrenheit = 32;
  console.log('   设置 32°F 后：', { celsius: temp.celsius, fahrenheit: temp.fahrenheit });

  // 6. static
  console.log('6) 静态成员：', MathUtils.PI, MathUtils.circleArea(5));

  // 7. 继承
  const dog = new Dog('Buddy', 3, 'Golden Retriever');
  console.log('7) 继承：', dog.move(20), dog.bark());

  // 8. 抽象类
  const shapes: Shape[] = [new Rectangle(10, 5), new Circle(7)];
  console.log('8) 抽象类：');
  shapes.forEach((shape) => console.log('   ', shape.describe()));

  // 9. 接口实现
  const logger = new ConsoleLogger();
  logger.log('系统启动');
  logger.log('处理请求');
  console.log('9) 接口实现：', logger.getLogs());

  // 10. 泛型类
  const numberCache = new Cache<number>();
  numberCache.set('answer', 42);
  console.log('10) 泛型类：', numberCache.get('answer'), numberCache.has('answer'));

  // 11. ES 私有字段
  const box = new SecureBox('绝密内容');
  console.log('11) ES 私有字段：', box.reveal('wrong'), box.reveal('admin'));

  // 12. 单例
  const db1 = Database.getInstance();
  const db2 = Database.getInstance();
  console.log('12) 单例：', db1 === db2, db1.query('SELECT * FROM users'));

  console.log('\n=== 演示结束 ===');
}

main();
