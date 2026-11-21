/**
 * ============================================================================
 * TypeScript 箭头函数用法全演示
 * ============================================================================
 * 运行方式：
 *   npx tsx apps/ts-arrow-function-demo.ts
 *
 * 覆盖：
 *   1. 基本语法
 *   2. 参数省略括号
 *   3. 单行隐式返回
 *   4. 多行显式返回
 *   5. 默认参数
 *   6. 解构参数
 *   7. 与常规函数的 this 对比
 *   8. 数组高阶方法中的箭头函数
 *   9. 回调函数
 *  10. 返回对象字面量
 *  11. 不适合使用箭头函数的场景
 * ============================================================================
 */

// ============================================================================
// 1. 基本语法
// ============================================================================
function basicSyntaxDemo(): void {
  console.log('1) 基本语法：');

  const add = (a: number, b: number): number => a + b;
  console.log(`   add(2, 3) = ${add(2, 3)}`);
}

// ============================================================================
// 2. 单参数可省略括号
// ============================================================================
function singleParamDemo(): void {
  console.log('\n2) 单参数可省略括号：');

  const square = (x: number): number => x * x;
  const squareNoParen = (x: number): number => x * x;

  console.log(`   square(4) = ${square(4)}`);
  console.log(`   squareNoParen(4) = ${squareNoParen(4)}`);
}

// ============================================================================
// 3. 单行隐式返回
// ============================================================================
function implicitReturnDemo(): void {
  console.log('\n3) 单行隐式返回：');

  const multiply = (a: number, b: number): number => a * b;
  const greet = (name: string): string => `Hello, ${name}!`;

  console.log(`   multiply(5, 6) = ${multiply(5, 6)}`);
  console.log(`   greet('TypeScript') = ${greet('TypeScript')}`);
}

// ============================================================================
// 4. 多行显式返回
// ============================================================================
function explicitReturnDemo(): void {
  console.log('\n4) 多行显式返回：');

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };

  console.log(`   factorial(5) = ${factorial(5)}`);
}

// ============================================================================
// 5. 默认参数
// ============================================================================
function defaultParamDemo(): void {
  console.log('\n5) 默认参数：');

  const createUser = (name: string, role: string = 'user'): string =>
    `${name} (${role})`;

  console.log(`   createUser('Alice') = ${createUser('Alice')}`);
  console.log(`   createUser('Bob', 'admin') = ${createUser('Bob', 'admin')}`);
}

// ============================================================================
// 6. 解构参数
// ============================================================================
interface Point {
  x: number;
  y: number;
}

function destructuringParamDemo(): void {
  console.log('\n6) 解构参数：');

  const distance = ({ x, y }: Point): number => Math.sqrt(x * x + y * y);
  const printCoords = ([x, y]: [number, number]): void => {
    console.log(`   coords: x=${x}, y=${y}`);
  };

  console.log(`   distance({x: 3, y: 4}) = ${distance({ x: 3, y: 4 })}`);
  printCoords([10, 20]);
}

// ============================================================================
// 7. 与常规函数的 this 对比
// ============================================================================
function thisLexicalDemo(): void {
  console.log('\n7) 箭头函数的词法 this：');

  const counter = {
    count: 0,
    incrementRegular: function (): void {
      // 普通函数：this 指向调用者
      setTimeout(function (this: { count?: number }) {
        // 这里的 this 不是 counter
        console.log(`   regular: this.count = ${this.count ?? 'undefined'}`);
      }, 10);
    },
    incrementArrow: function (): void {
      // 箭头函数：this 继承外层作用域
      setTimeout(() => {
        this.count += 1;
        console.log(`   arrow: this.count = ${this.count}`);
      }, 20);
    },
  };

  counter.incrementRegular();
  counter.incrementArrow();
}

// ============================================================================
// 8. 数组高阶方法中的箭头函数
// ============================================================================
function arrayMethodsDemo(): void {
  console.log('\n8) 数组高阶方法：');

  const numbers: number[] = [1, 2, 3, 4, 5];

  const doubled: number[] = numbers.map((n) => n * 2);
  const evens: number[] = numbers.filter((n) => n % 2 === 0);
  const sum: number = numbers.reduce((acc, n) => acc + n, 0);
  const firstGreaterThan3: number | undefined = numbers.find((n) => n > 3);

  console.log(`   map doubled = [${doubled.join(', ')}]`);
  console.log(`   filter evens = [${evens.join(', ')}]`);
  console.log(`   reduce sum = ${sum}`);
  console.log(`   find >3 = ${firstGreaterThan3}`);
}

// ============================================================================
// 9. 回调函数
// ============================================================================
function callbackDemo(): void {
  console.log('\n9) 回调函数：');

  const fetchData = (
    id: number,
    callback: (err: Error | null, data?: string) => void,
  ): void => {
    setTimeout(() => {
      if (id <= 0) {
        callback(new Error('Invalid id'));
      } else {
        callback(null, `data-${id}`);
      }
    }, 30);
  };

  fetchData(42, (err, data) => {
    if (err) {
      console.log(`   error: ${err.message}`);
    } else {
      console.log(`   received: ${data}`);
    }
  });
}

// ============================================================================
// 10. 返回对象字面量
// ============================================================================
function returnObjectLiteralDemo(): void {
  console.log('\n10) 返回对象字面量（需加括号）：');

  const makePerson = (name: string, age: number): { name: string; age: number } =>
    ({ name, age });

  const person = makePerson('Carol', 28);
  console.log(`   person = ${JSON.stringify(person)}`);
}

// ============================================================================
// 11. 不适合使用箭头函数的场景
// ============================================================================
function notSuitableDemo(): void {
  console.log('\n11) 不适合箭头函数的场景：');

  // 场景 A：对象方法（this 不会指向对象本身）
  const badCounter = {
    count: 0,
    increment: () => {
      // this.count 无法访问到 badCounter.count
      console.log('   arrow method: this 不指向 badCounter');
    },
  };
  badCounter.increment();

  // 场景 B：构造函数（会报错）
  const Person = (name: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore 故意演示：箭头函数在顶层 this 为 any，且不能作为构造函数
    this.name = name;
  };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (Person as any)('Dave');
  } catch (e) {
    console.log(`   arrow constructor: ${(e as Error).message}`);
  }

  // 场景 C：需要 arguments 对象时
  const normalSum = function (this: void, ...args: number[]): number {
    return args.reduce((acc, n) => acc + n, 0);
  };
  console.log(`   regular with rest params: ${normalSum(1, 2, 3, 4)}`);
}

// ============================================================================
// 主程序
// ============================================================================
function main(): void {
  basicSyntaxDemo();
  singleParamDemo();
  implicitReturnDemo();
  explicitReturnDemo();
  defaultParamDemo();
  destructuringParamDemo();
  thisLexicalDemo();
  arrayMethodsDemo();
  callbackDemo();
  returnObjectLiteralDemo();
  notSuitableDemo();
}

main();
