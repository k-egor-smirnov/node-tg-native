# node-tg-native [![NPM version](https://badge.fury.io/js/node-tg-native.svg)](https://npmjs.org/package/node-tg-native)

> Module to call native TDLib functions

## Installation

```sh
$ npm install --save node-tg-native
```

## Usage

```js
const nodeTgNative = require('node-tg-native')
const td = new nodeTgNative()

td.create()

td.subscribe((response) => {
  console.log(response)
})
```

## License

MIT © [k-egor-smirnov]()
