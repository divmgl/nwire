# nwire.js

[![Build Status](https://travis-ci.org/divmgl/nwire.svg?branch=master)](https://travis-ci.org/divmgl/nwire)
[![Join the chat at https://gitter.im/divmgl/nwire](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/divmgl/nwire?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Simplified dependency injection in Node.js

## Installation
`$ npm install nwire`

## Example

Bootstrapping a simple server using Express.js:

```js
// index.js
var wire = require('nwire');
var config = require('./config');

var app = wire(config);  // Composite root
app.server.listen(3000); // Start your server
```
```js
// server.js
module.exports.needs = ['express'];     
module.exports.fn = function(imports) {
  var app = imports.express();

  // Add your routes and configuration here

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

You must feed `nwire` a configuration object containing the packages you wish to provide for injection.

Consider this sample configuration object.
```js
// config.js
module.exports = {
  'app': require('./server'),
  'redis-db': require('./db'),
  'express': require('express'),
  'morgan': require('morgan'),
  'passport': require('passport')
};
```

Here we can see that the packages `app`, `redis-db`, `express`, `morgan`, and `passport` are registered and are ready to be injected in packages that need them. `nwire` will then inject all other four packages through the `imports` parameter for objects that contain the properties `fn` and `needs`.

```js
// server.js
module.exports.needs = ['redis-db', 'express', 'morgan', 'passport'];
module.exports.fn = function(import){ // You can use $ for short
  // import now contains four properties each named after the injected packages
  var app = import.express();
  import["redis-db"].open();
}
```

## Creating packages

Packages are comprised of two properties: `fn` and `needs`.

The `fn` function returns an object for injection in other packages. Consider the following authentication package that provides login and logout functionality.

```js
// auth.js
module.exports.fn = function(imports) {
  var login = function login(username, password, callback){
    // Perform authentication here...
  }
  var logout = function logout(callback) { /*...*/ }

  return {
    login: login,
    logout: logout
  }
}
```
This package returns an object that exposes two functions: `login` and `logout`. The returned object is then injected in  other packages that require it through the `needs` property.

```js
// server.js
module.exports.needs = ['auth'];
module.exports.fn = function($) {
  $.auth.login('testing', '123', function(err, user){
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
module.exports.fn = function($) { return $.Vue.component({}); }
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
module.exports.fn = function($) {
  console.log($.components) // => Object
  console.log($.components.header) // => Object
  console.log($["components.header"]) // => Undefined
}
```

## Running the test suite

```
$ npm install
$ npm test
```

## Suggestions and questions

If you have any suggestions or questions regarding this project, please open an issue. If you feel that you have a feature that would be useful to add, fork it and open a pull request.
