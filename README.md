### (Kindof) Secure Static Chat App

*At least its better than the [other one](https://github.com/ephf/static-chat)*

Uses [`jsx`](https://npmjs.com/package/just-jsx) and [`tailwind cdn`](https://tailwindcss.com)

If you want your own version, clone and change [`firebase-name.json`](firebase-name.json) to your own [firebase](https://firebase.google.com) name. Make sure to enable `Realtime Database`. All of the code works without backend, besides the firebase of course. Do what you want with it.

The message stream is done with the firebase `rest` api using `EventSource` in [`components/MessageStream.js`](components/MessageStream.js) and thats the only real magic to make this static instead of fullstack.

```js
new EventSource("https://your-database.firebaseio.com/path/to/stream.json")
  .addEventListener("put", ({ data }) => /* tada ✨ */)
```

Mostly everything is encripted with `xor` operations using a password or key and then is stored as an array so no data is lost in javascript's weirdness. [`firebase.js`](firebase.js)

```js
export function parse(a, b) {
  if (a instanceof Array)
    return a.map((charCode, i) => charCode ^ b.charCodeAt(i & b.length));
  if (typeof a == "string")
    return [...a].map(
      (char, i) => char.charCodeAt(0) ^ b.charCodeAt(i & b.length)
    );
  return null;
}
```

This data is turned back into a string by adding a prototype function to `Array`

```js
Array.prototype.toParsed = function () {
  return this.map((charCode) => String.fromCharCode(charCode)).join("");
};
```