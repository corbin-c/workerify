# Workerify

Workerifiy is an ES module to wrap any function or object into a Web Worker. It
avoids the pain of creating a separate worker file and handling messages. One pass
a function or an object to Workerify, which returns an asynchronous function.
This function may be called just like the original one but will be processed in
the dedicated Web Worker; it will return promises.

## Context

It is possible to pass an additional `context` argument to Workerify. This context
is an array of objects or functions, which may be required for the main target
functions. 

## Example

First, import Workerify from here with:

```javascript
import { Workerify } from "https://corbin-c.github.io/workerify/workerify.js";
```

Then, we'll create here an `async` context. We declare here an `example` object,
with various methods. This object is passed to `Workerify`. The original
`example` object may then be called without further trouble:

```javascript
(async () => {
  let example = {
    square: (x) => x*x,
    cube:(x) => x*x*x,
    sum:(...args) => args.reduce((accumulator,current) => accumulator+current),
    multiply:(x,y) => x*y,
  }
  example = Workerify(example);
  console.log(await example.square(2));
  console.log(await example.cube(2));
  console.log(await example.sum(1,2,3,4,5));
  console.log(await example.multiply(2,5));
})();
```
