const name = await fetch("./firebase-name.json").then((res) => res.json());

export default new Proxy(
  {},
  {
    get(_target, prop) {
      return (path, body) =>
        Object.assign(
          fetch(`https://${name}-default-rtdb.firebaseio.com/${path}.json`, {
            method: prop.toUpperCase(),
            body: body && JSON.stringify(body),
          }).then((res) => res.json()),
          {
            async array() {
              return Object.entries((await this) ?? {}).map(
                ([id, content]) => ({
                  ...content,
                  id,
                })
              );
            },
          }
        );
    },
  }
);

Array.prototype.toParsed = function () {
  return this.map((charCode) => String.fromCharCode(charCode)).join("");
};

export function parse(a, b) {
  if (a instanceof Array)
    return a.map((charCode, i) => charCode ^ b.charCodeAt(i & b.length));
  if (typeof a == "string")
    return [...a].map(
      (char, i) => char.charCodeAt(0) ^ b.charCodeAt(i & b.length)
    );
  return null;
}

export function parseObject(object, b, toParsed) {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) =>
      key == "id"
        ? [key, value]
        : [key, toParsed ? parse(value, b)?.toParsed() : parse(value, b)]
    )
  );
}
