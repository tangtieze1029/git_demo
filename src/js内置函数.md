# JS 常用内置函数速查

## 1. 全局函数

```js
parseInt('42px', 10)        // 42      转整数（建议总带基数）
parseFloat('3.14abc')       // 3.14    转浮点
isNaN('abc')                // true    会做隐式转换，不推荐
Number.isNaN(NaN)           // true    严格判断，推荐
encodeURIComponent('a b')   // 'a%20b' URL 参数编码
decodeURIComponent('a%20b') // 'a b'
```

## 2. String

```js
const s = ' Hello World '
s.trim()                    // 'Hello World'
s.toLowerCase()             // ' hello world '
s.includes('World')         // true
s.indexOf('o')              // 5
s.startsWith(' He')         // true
s.slice(1, 6)               // 'Hello'
s.split(' ')                // ['', 'Hello', 'World', '']
s.replace('World', 'JS')    // ' Hello JS '
s.replaceAll('l', 'L')      // 全部替换
s.padStart(15, '*')         // 补位
s.repeat(2)                 // 重复
s.at(-1)                    // 支持负索引（ES2022）
'abc'.charAt(1)             // 'b'
'abc'.charCodeAt(0)         // 97
```

## 3. Array（最常用）

```js
const arr = [1, 2, 3, 4]

// 遍历 / 转换
arr.map(x => x * 2)              // [2,4,6,8]      映射
arr.filter(x => x > 2)           // [3,4]          过滤
arr.reduce((a, b) => a + b, 0)   // 10             聚合
arr.forEach(x => console.log(x)) // 无返回值，副作用

// 查找 / 判断
arr.find(x => x > 2)             // 3
arr.findIndex(x => x > 2)        // 2
arr.includes(3)                  // true
arr.some(x => x > 3)             // true   任一满足
arr.every(x => x > 0)            // true   全部满足
arr.indexOf(2)                   // 1

// 增删（会改原数组）
arr.push(5)                      // 尾部加
arr.pop()                        // 尾部删
arr.unshift(0)                   // 头部加
arr.shift()                      // 头部删
arr.splice(1, 2, 'a')            // 删除/插入/替换

// 不改原数组
arr.slice(1, 3)                  // [2,3]
arr.concat([5, 6])               // 合并
arr.join('-')                    // '1-2-3-4'
[...arr].sort((a, b) => b - a)   // 降序（sort 会改原数组）
[...arr].reverse()
arr.flat(Infinity)               // 拍平
arr.flatMap(x => [x, x])         // map + flat
arr.at(-1)                       // 4

// 静态方法
Array.isArray(arr)               // true
Array.from('abc')                // ['a','b','c']
Array.from({ length: 3 }, (_, i) => i) // [0,1,2]
Array.of(1, 2, 3)                // [1,2,3]
```

## 4. Object

```js
const obj = { a: 1, b: 2 }

Object.keys(obj)                 // ['a','b']
Object.values(obj)               // [1,2]
Object.entries(obj)              // [['a',1],['b',2]]
Object.fromEntries([['a', 1]])   // { a: 1 }    entries 的逆操作
Object.assign({}, obj, { c: 3 }) // 浅合并
Object.freeze(obj)               // 冻结（浅）
Object.isFrozen(obj)
Object.create(null)              // 无原型对象
Object.hasOwn(obj, 'a')          // ES2022，替代 hasOwnProperty
```

## 5. Number / Math

```js
Number('42')                     // 42
Number.isInteger(42)             // true
Number.isFinite(1 / 0)           // false
Number.MAX_SAFE_INTEGER

(3.14159).toFixed(2)             // '3.14'  返回字符串

Math.round(4.6)                  // 5
Math.floor(4.9)                  // 4
Math.ceil(4.1)                   // 5
Math.abs(-3)                     // 3
Math.max(...[1, 5, 3])           // 5
Math.min(1, 5, 3)                // 1
Math.random()                    // [0, 1)
Math.pow(2, 10)                  // 1024
Math.trunc(-4.7)                 // -4   直接截断
```

## 6. JSON

```js
JSON.stringify({ a: 1 })             // '{"a":1}'
JSON.stringify(obj, null, 2)         // 格式化输出
JSON.parse('{"a":1}')                // { a: 1 }
JSON.parse(str, (k, v) => v)         // 带 reviver
structuredClone({ a: { b: 1 } })     // 深拷贝（现代浏览器）
```

## 7. Date

```js
Date.now()                       // 时间戳（毫秒）
new Date().toISOString()         // '2026-11-18T...Z'
new Date().getTime()             // 同 Date.now()
d.getFullYear(); d.getMonth() + 1; d.getDate() // 注意月份从 0 开始
```

## 8. Promise / 异步

```js
Promise.all([p1, p2])            // 全部成功才成功，任一失败即失败
Promise.allSettled([p1, p2])     // 等全部结束，返回状态数组
Promise.race([p1, p2])           // 第一个结束的（无论成败）
Promise.any([p1, p2])            // 第一个成功的
await new Promise(r => setTimeout(r, 1000))
```

## 9. 其他常用

```js
setTimeout(fn, 1000)             // 延时执行
setInterval(fn, 1000)            // 周期执行
clearTimeout(id) / clearInterval(id)
new Map() / new Set()            // 键值集合 / 去重集合
[...new Set([1, 1, 2])]          // [1, 2]  去重
```

## 高频易错点

- `sort()` 默认按字符串排序，数字要传比较函数。
- `splice` 改原数组，`slice` 不改。
- `map/filter/reduce` 不改变原数组。
- `toFixed` 返回字符串，参与计算前要转回数字。
- `parseInt` 一定要传基数，避免历史兼容问题。
