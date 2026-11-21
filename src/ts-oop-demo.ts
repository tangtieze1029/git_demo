/**
 * ============================================================================
 * TypeScript 面向对象（OOP）设计演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-oop-demo.ts
 *
 * 类型校验：
 *   npx tsc --noEmit
 *
 * 与 ts-class-demo.ts 的分工：
 *   - ts-class-demo.ts 讲「类语法」：修饰符、构造器、getter、static、泛型类
 *   - 本文件讲「面向对象设计」：封装、继承、多态、抽象、接口、组合、SOLID
 *
 * 覆盖清单：
 *   1.  封装：私有状态 + 受控访问（值对象 + 不变式）
 *   2.  继承与 super / override
 *   3.  多态：基类引用、运行时派发
 *   4.  抽象类：模板方法模式
 *   5.  接口：多实现、接口继承、结构类型
 *   6.  组合优于继承：策略模式
 *   7.  SOLID 五个原则的最小示例
 *   8.  Mixin：受类型约束的混入
 *   9.  抽象成员与 protected：受控扩展点
 *   10. 编译期断言
 * ============================================================================
 */

// 类型工具：编译期校验类型推断
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// ============================================================================
// 1. 封装：私有状态 + 受控访问
//    面向对象的第一原则：状态只能通过行为改变，不变式由类自己守护。
// ============================================================================
class Money {
  // 私有 + 只读：外部既拿不到也无法替换内部金额
  readonly #amount: number;
  readonly #currency: Currency;

  constructor(amount: number, currency: Currency) {
    if (!Number.isFinite(amount)) {
      throw new Error('金额必须是有效数字');
    }
    if (amount < 0) {
      throw new Error('金额不能为负数');
    }
    this.#amount = amount;
    this.#currency = currency;
  }

  get amount(): number {
    return this.#amount;
  }

  get currency(): Currency {
    return this.#currency;
  }

  // 行为返回新实例（不可变），调用方无法绕过校验
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.#amount + other.amount, this.#currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('乘数不能为负数');
    }
    return new Money(this.#amount * factor, this.#currency);
  }

  format(): string {
    return `${this.#currency} ${this.#amount.toFixed(2)}`;
  }

  // 私有方法：对外不可见，只服务于内部不变式
  private assertSameCurrency(other: Money): void {
    if (this.#currency !== other.currency) {
      throw new Error(`币种不一致：${this.#currency} vs ${other.currency}`);
    }
  }
}

type Currency = 'CNY' | 'USD';

function encapsulationDemo(): void {
  console.log('1) 封装');

  const price = new Money(99.9, 'CNY');
  const total = price.multiply(3);
  console.log('   单价：', price.format(), '/ 总价：', total.format());

  // 构造期就拦住非法值，坏状态进不来
  try {
    new Money(-1, 'CNY');
  } catch (error) {
    console.log('   构造校验拦截：', (error as Error).message);
  }

  try {
    price.add(new Money(10, 'USD'));
  } catch (error) {
    console.log('   行为校验拦截：', (error as Error).message);
  }
}

// ============================================================================
// 2. 继承与 super / override
//    override 是显式契约：父类删了同名方法，子类会立刻编译报错。
// ============================================================================
abstract class Employee {
  constructor(
    public readonly id: string,
    public readonly name: string,
    protected baseSalary: number,
  ) {}

  // 可被子类覆写的默认实现
  calculatePay(): number {
    return this.baseSalary;
  }

  // 公共模板：固定顺序调用可变部分，子类只改 stop 的细节
  describe(): string {
    return `${this.id} ${this.name} → ${this.calculatePay().toFixed(2)}`;
  }
}

class FullTimeEmployee extends Employee {
  constructor(
    id: string,
    name: string,
    baseSalary: number,
    private readonly bonus: number,
  ) {
    super(id, name, baseSalary); // 必须先调 super 才能访问 this
  }

  override calculatePay(): number {
    // 复用父类结果，避免复制粘贴维护两份逻辑
    return super.calculatePay() + this.bonus;
  }
}

class InternEmployee extends Employee {
  override calculatePay(): number {
    // 实习生按 60% 结算
    return super.calculatePay() * 0.6;
  }
}

function inheritanceDemo(): void {
  console.log('\n2) 继承与 override');

  const staff: Employee[] = [
    new FullTimeEmployee('E1', '张三', 10000, 2000),
    new InternEmployee('E2', '李四', 5000),
  ];
  for (const person of staff) {
    console.log('  ', person.describe());
  }
}

// ============================================================================
// 3. 多态：基类引用、运行时派发
//    调用方只依赖抽象，不关心具体子类 —— 新增子类无需改调用方代码。
// ============================================================================
interface Shape {
  readonly kind: string;
  area(): number;
  perimeter(): number;
}

class Circle implements Shape {
  readonly kind = 'circle';
  constructor(private readonly radius: number) {}
  area(): number {
    return Math.PI * this.radius ** 2;
  }
  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle implements Shape {
  readonly kind = 'rect';
  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}
  area(): number {
    return this.width * this.height;
  }
  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

function polymorphismDemo(): void {
  console.log('\n3) 多态');

  const shapes: Shape[] = [new Circle(2), new Rectangle(3, 4)];
  // 同一调用，按实际类型派发不同实现
  const report = shapes.map((s) => `${s.kind}: 面积 ${s.area().toFixed(2)}`);
  console.log('  ', report.join(' | '));
  console.log('   总周长：', shapes.reduce((sum, s) => sum + s.perimeter(), 0).toFixed(2));
}

// ============================================================================
// 4. 抽象类：模板方法模式
//    算法骨架写在基类，可变步骤交给子类实现；子类无法改变调用顺序。
// ============================================================================
abstract class DataExporter {
  // 模板方法：final 语义（TS 没有 final，靠约定：子类不要 override）
  export(rows: readonly string[]): string {
    const prepared = this.prepare(rows);
    const header = this.header();
    const body = prepared.map((row) => this.formatRow(row)).join('\n');
    return `${header}\n${body}\n${this.footer()}`;
  }

  // 受保护扩展点：子类实现，外部不可调用
  protected abstract formatRow(row: string): string;

  // 可选钩子：默认有实现，子类按需覆盖
  protected prepare(rows: readonly string[]): readonly string[] {
    return rows;
  }

  protected header(): string {
    return '--- begin ---';
  }

  protected footer(): string {
    return '--- end ---';
  }
}

class CsvExporter extends DataExporter {
  protected override formatRow(row: string): string {
    return row.split(',').join(';');
  }
}

class JsonExporter extends DataExporter {
  protected override prepare(rows: readonly string[]): readonly string[] {
    // 钩子重写：过滤空行
    return rows.filter((row) => row.trim() !== '');
  }
  protected override formatRow(row: string): string {
    return `  "${row}",`;
  }
  protected override header(): string {
    return '[\n';
  }
  protected override footer(): string {
    return ']';
  }
}

function templateMethodDemo(): void {
  console.log('\n4) 抽象类与模板方法');

  const rows = ['a,b', '', 'c,d'];
  console.log('   CSV:\n' + new CsvExporter().export(rows));
  console.log('   JSON:\n' + new JsonExporter().export(rows));
}

// ============================================================================
// 5. 接口：多实现、接口继承、结构类型
//    TS 是结构类型系统：只要形状吻合，无需显式 implements 也算兼容。
// ============================================================================
interface Timestamped {
  readonly createdAt: Date;
}

interface Identifiable {
  readonly id: string;
}

// 接口继承：合并多个能力
interface AuditRecord extends Identifiable, Timestamped {
  readonly action: string;
}

class Order implements Identifiable, Timestamped {
  readonly id: string;
  readonly createdAt: Date;
  constructor(id: string, readonly amount: number) {
    this.id = id;
    this.createdAt = new Date();
  }
}

function interfaceDemo(): void {
  console.log('\n5) 接口与结构类型');

  // 结构类型：Order 没 implements AuditRecord，但形状满足即可
  const record: AuditRecord = { id: 'R1', createdAt: new Date(), action: 'create' };
  const order: Identifiable = new Order('O1', 100);
  console.log('   接口继承：', record.action, '/ 结构兼容：', order.id);

  // 只要形状对，普通对象也能当 Shape 用
  const adHoc: Shape = {
    kind: 'triangle',
    area: () => 6,
    perimeter: () => 12,
  };
  console.log('   普通对象满足接口：', adHoc.kind, adHoc.area());
}

// ============================================================================
// 6. 组合优于继承：策略模式
//    变化的部分抽成接口注入，避免为每种组合建一层继承树。
// ============================================================================
interface DiscountStrategy {
  readonly label: string;
  apply(amount: number): number;
}

class NoDiscount implements DiscountStrategy {
  readonly label = '无折扣';
  apply(amount: number): number {
    return amount;
  }
}

class PercentDiscount implements DiscountStrategy {
  readonly label: string;
  constructor(private readonly percent: number) {
    this.label = `${percent}% off`;
  }
  apply(amount: number): number {
    return amount * (1 - this.percent / 100);
  }
}

class ThresholdDiscount implements DiscountStrategy {
  readonly label: string;
  constructor(
    private readonly threshold: number,
    private readonly reduce: number,
  ) {
    this.label = `满 ${threshold} 减 ${reduce}`;
  }
  apply(amount: number): number {
    return amount >= this.threshold ? amount - this.reduce : amount;
  }
}

// 组合而非继承：Checkout 只持有策略，不关心具体算法
class Checkout {
  constructor(private readonly strategy: DiscountStrategy) {}

  // 运行时替换策略，无需新增子类
  withStrategy(strategy: DiscountStrategy): Checkout {
    return new Checkout(strategy);
  }

  total(amount: number): string {
    const final = this.strategy.apply(amount);
    return `${this.strategy.label}: ${amount} → ${final.toFixed(2)}`;
  }
}

function compositionDemo(): void {
  console.log('\n6) 组合优于继承（策略模式）');

  const base = new Checkout(new NoDiscount());
  const lines = [
    base.total(200),
    base.withStrategy(new PercentDiscount(15)).total(200),
    base.withStrategy(new ThresholdDiscount(150, 30)).total(200),
  ];
  for (const line of lines) {
    console.log('  ', line);
  }
}

// ============================================================================
// 7. SOLID 五原则最小示例
//    S 单一职责：拆分「取数」与「渲染」
//    O 开闭原则：新增格式不改旧代码（策略/多态）
//    L 里氏替换：子类可替换父类且不破坏契约
//    I 接口隔离：小接口而非大而全
//    D 依赖倒置：依赖抽象而非具体实现
// ============================================================================
interface UserRepository {
  findById(id: string): { id: string; name: string } | null;
}

interface UserRenderer {
  render(user: { id: string; name: string }): string;
}

// S + D：只依赖抽象，具体实现可替换（内存库 / HTTP 库）
class InMemoryUserRepository implements UserRepository {
  constructor(private readonly store: Map<string, { id: string; name: string }>) {}
  findById(id: string): { id: string; name: string } | null {
    return this.store.get(id) ?? null;
  }
}

class PlainUserRenderer implements UserRenderer {
  render(user: { id: string; name: string }): string {
    return `${user.id}: ${user.name}`;
  }
}

class UserService {
  // D：通过构造器注入抽象
  constructor(
    private readonly repo: UserRepository,
    private readonly renderer: UserRenderer,
  ) {}

  describe(id: string): string {
    const user = this.repo.findById(id);
    // L/健壮性：抽象返回 null 是契约的一部分，必须处理
    return user === null ? `未找到 ${id}` : this.renderer.render(user);
  }
}

function solidDemo(): void {
  console.log('\n7) SOLID');

  const repo = new InMemoryUserRepository(new Map([['U1', { id: 'U1', name: '王五' }]]));
  const service = new UserService(repo, new PlainUserRenderer());
  console.log('   命中：', service.describe('U1'), '/ 未命中：', service.describe('U9'));
}

// ============================================================================
// 8. Mixin：受类型约束的混入
//    用构造函数泛型实现「混入能力」，避免深继承；TS 需要类型断言桥接。
// ============================================================================
type Constructor<T = object> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    readonly createdAt: Date = new Date();
    touch(): string {
      return this.createdAt.toISOString();
    }
  };
}

function Serializable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    serialize(): string {
      return JSON.stringify(this);
    }
  };
}

class BaseEntity {
  constructor(public readonly id: string) {}
}

// 两个 Mixin 叠加：比多层继承组合更灵活
const AuditableEntity = Serializable(Timestamped(BaseEntity));

function mixinDemo(): void {
  console.log('\n8) Mixin 混入');

  const entity = new AuditableEntity('X1');
  console.log('   id：', entity.id);
  console.log('   touch：', entity.touch().slice(0, 10));
  console.log('   serialize：', entity.serialize());
}

// ============================================================================
// 9. 抽象成员与受控扩展点
//    private 封死、protected 留给子类、public 对外承诺 —— 修饰符就是 API 边界。
// ============================================================================
class Cache<T> {
  private store = new Map<string, T>();
  protected hits = 0;
  protected misses = 0;

  get(key: string): T | undefined {
    const value = this.store.get(key);
    if (value === undefined) {
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return value;
  }

  set(key: string, value: T): void {
    this.store.set(key, value);
  }

  // 统计逻辑开放给子类重写，但字段本身外部不可见
  stats(): string {
    return `hits=${this.hits} misses=${this.misses}`;
  }
}

class UpperCaseCache extends Cache<string> {
  // 重写扩展点：命中率统计之外再加一层归一化
  override get(key: string): string | undefined {
    return super.get(key.trim().toLowerCase());
  }

  override set(key: string, value: string): void {
    super.set(key.trim().toLowerCase(), value);
  }

  override stats(): string {
    const total = this.hits + this.misses;
    const rate = total === 0 ? 0 : (this.hits / total) * 100;
    return `${super.stats()} hitRate=${rate.toFixed(0)}%`;
  }
}

function modifiersDemo(): void {
  console.log('\n9) 修饰符与受控扩展点');

  const cache = new UpperCaseCache();
  cache.set('  Token ', 'abc');
  console.log('   归一化后命中：', cache.get('token'));
  cache.get('missing');
  console.log('   统计：', cache.stats());
}

// ============================================================================
// 10. 编译期断言
// ============================================================================
function assertDemo(): void {
  console.log('\n10) 编译期断言');

  // 私有字段无法从外部访问（见第 12 节反例）
  type MoneyKeys = keyof Money;
  type ShapeKeys = keyof Shape;

  const checks: true[] = [
    // 私有成员的 keyof 不暴露 #amount
    true as Expect<Equal<MoneyKeys, 'amount' | 'currency' | 'add' | 'multiply' | 'format'>>,
    // 接口的 keyof 收集全部公开成员
    true as Expect<Equal<ShapeKeys, 'kind' | 'area' | 'perimeter'>>,
    // 子类实例仍是父类型（里氏替换）
    true as Expect<Equal<FullTimeEmployee extends Employee ? true : false, true>>,
    // 结构类型：形状吻合即兼容
    true as Expect<Equal<Order extends Identifiable ? true : false, true>>,
  ];

  console.log('   通过断言数：', checks.length);
}

// ============================================================================
// 11. 反例（编译期校验，不会执行）
// ============================================================================
void (function typeErrorCases(): void {
  // 1) private 方法外部不可访问（# 私有字段的越界访问连解析都不通过，故此处用 private 方法演示）
  const money = new Money(1, 'CNY');
  // @ts-expect-error assertSameCurrency 是 private
  money.assertSameCurrency(money);

  // 2) readonly 成员不可重新赋值
  // @ts-expect-error id 是 readonly
  money.amount = 2;

  // 3) 抽象类不能实例化
  // @ts-expect-error Employee 是抽象类
  new Employee('E1', 'x', 1);

  // 4) 未实现抽象成员
  // @ts-expect-error 缺少 formatRow 实现
  class BadExporter extends DataExporter {}

  // 5) protected 成员外部不可访问
  const intern = new InternEmployee('E3', '王五', 1000);
  // @ts-expect-error baseSalary 是 protected
  intern.baseSalary;

  // 6) 实现接口时漏成员
  // @ts-expect-error 缺少 perimeter
  class HalfShape implements Shape {
    readonly kind = 'half';
    area(): number {
      return 0;
    }
  }

  void BadExporter;
  void HalfShape;
});

// ============================================================================
// 主程序
// ============================================================================
function main(): void {
  encapsulationDemo();
  inheritanceDemo();
  polymorphismDemo();
  templateMethodDemo();
  interfaceDemo();
  compositionDemo();
  solidDemo();
  mixinDemo();
  modifiersDemo();
  assertDemo();
  console.log('\n11) 反例见 typeErrorCases()，均为编译期报错');
}

main();
