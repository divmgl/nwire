# nwire.js

[![Build Status](https://travis-ci.org/divmgl/nwire.svg?branch=master)](https://travis-ci.org/divmgl/nwire)
[![Join the chat at https://gitter.im/divmgl/nwire](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/divmgl/nwire?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Simplified dependency injection in Node.js

## Installation
`$ npm install nwire`

## Example

Bootstrapping a simple server using Express:

```js
// index.js
var wire = require('nwire');
var config = require('./config');

var app = wire(config);
app.server.listen(3000);
```
```js
// server.js
module.exports.needs = ['express'];     
module.exports.fn = function(imports) { 
  var app = imports.express(); // Injected by nwire 
 
  // ... routes and configuration go here ...

  return app;
}
```
```js
// config.js
module.exports = {
  'server': require('./server'),
  'express': require('express')
}
```

## Why?

Dependency injection shouldn't be complicated. `nwire` encourages loosely coupled functionality and simplifies the process of isolating your code for testing.

## Creating the container

You must call `nwire` with an object containing the packages you wish to register. `nwire` will return a container.

```js
// config.js
module.exports = {
  'app': require('./server'),
  'express': require('express'),
  'morgan': require('morgan'),
  'passport': require('passport')
};
```
```js
// index.js
var app = nwire(require('./config')); // => Object
```

## Performing dependency injection

The container is just a standard object unless `nwire` detects packages that contain two properties: `fn` and `needs`. `nwire` will replace these packages with the return value of the `fn` function called with an array of resolved dependencies.

```js
// auth.js
module.exports.needs = [];
module.exports.fn = function(imports) { // Access dependencies through imports
  var login = function (username, password, callback){ /*...*/ }
  var logout = function (callback) { /*...*/ }

  return { // This entire package is replaced with the following return value
    login: login,
    logout: logout
  }
}
```

The latter package is replaced with an object containing two functions: `login` and `logout`. This object can then be injected in other packages that ask for it through `needs` property.

```js
// server.js
module.exports.needs = ['auth'];
module.exports.fn = function(imports) {
  imports.auth.login('testing', '123', function(err, user){
    // Handle whether user is authorized
  });
}
```

If the `fn` and `needs` properties are not provided, `nwire` will not perform any dependency injection.

## Nested packages

`nwire` will recursively look for packages that implement `fn` and `needs`. It will also inject packages from the parent scope.

```js
// components/header.js
module.exports.needs = ['Vue'];
module.exports.fn = function(imports) { return imports.Vue.component({}); }
```
```js
// config.js
module.exports = {
  Vue: require('vue'),
  components: { // Vue is injected even though the object is nested
    header: require('./components/header')
  }
}
```

However you cannot inject nested objects, only their parents.

```js
// application.js
module.exports.needs = [
  "components",
  "components.header"
]

module.exports.fn = function(imports) {
  console.log(imports.components) // => Object
  console.log(imports.components.header) // => Object
  console.log(imports["components.header"]) // => Undefined
}
```

## Caveats

`nwire` does not handle circular dependency, so make sure not to create a circular reference between your packages.

All packages are singleton. If you need to create objects that have dependencies, return a function. Modifying an injected package will affect all dependent children. For this reason, try not to store state in your packages.

## Running the test suite

```
$ npm install
$ npm test
```

## License

MIT
