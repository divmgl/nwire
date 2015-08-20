# nwire.js

[![Join the chat at https://gitter.im/divmgl/nwire](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/divmgl/nwire?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Inspirational dependency injection in Node.js.

## Installation
`$ npm install nwire`

## Example

Bootstrapping a server using Express.js:

```js
// index.js
var wire = require('nwire');
var config = require('./config');

wire(config, function(err, app){ // Composite root
  app.packages.server.listen(3000);
});
```
```js
// server.js
module.exports.needs = ['express'];
module.exports.fn = function(imports){
  var express = imports.express;
  var app = express();
  return app;
}
```
```js
// config.js
module.exports = {
  url: __dirname, // Base URL
  packages: { // Packages to be injected
    'server': './server',
    'express': 'express'
  }
}
```

## Why?

Many Node.js IoC modules exist. However, most require writing lots of boilerplate and others are simply too cumbersome to use. nwire.js is an extremely simple but effective dependency injection solution.

## Creating packages

### Package definition 

Packages are comprised of two properties: `fn` and `needs`.

The `fn` function returns an object for injection in other packages. Consider the following authentication package that provides login and logout functionality.

```js
// auth.js
module.exports.fn = function(imports) {
  var login = function login(username, password, callback){
    // Perform authentication here...
  }
  var logout = function logout(callback) { }
  
  return { 
    login: login,
    logout: logout 
  }
}
```
This package resolves an object that exposes two functions: `login` and `logout`. The resolved object is then injected in  other packages that require it through the `needs` property.

```js
// server.js
module.exports.needs = ['auth'];
module.exports.fn = function(imports) {
  var auth = imports.auth;
  auth.login('testing', '123', function(err){
    // Handle whether user is authorized
  });
}
```
If the `fn` property is not provided, nwire.js will not perform any dependency injection and will load the entire module into memory. If the `needs` property is not provided, the `imports` parameter will be empty.

### Package declaration

In order to perform dependency injection, you must feed nwire.js a configuration object containing the `url` and `packages` properties.

The `url` property allows nwire.js to resolve packages without needing their absolute paths. In most configurations, assigning `__dirname` to the `url` property will do. If this property is not provided, nwire.js will resolve modules from within its own directory.

The `packages` property assigns a name and location for every package. It must contain an object where property names define package names and property values are corresponding locations.

Consider this sample configuration object.
```js
// config.js
var path = require('path');
module.exports = {
  url: path.join(__dirname, 'src'),
  packages: {
    'app': './server',
    'database': './db',
    'express': 'express',
    'morgan': 'morgan',
    'passport': 'passport'
  }
};
```

Here we can see that the packages `app`, `database`, `express`, `morgan`, and `passport` are registered and are ready to be injected in packages that need them. Assuming that the `app` package looks like the following code, nwire.js will inject all other four packages through the `imports` parameter.

```js
// server.js
module.exports.needs = ['database', 'express', 'morgan', 'passport'];
module.exports.fn = function(import){ 
  // import now contains four properties each named after the injected packages
  var app = import.express();
}
```

## Upcoming improvements

nwire.js is in its infancy. Therefore, there are quite a bit of improvements that can be made to the module. Here are some items that are being considered and may be included in a future update.

* Better tests that do not require boilerplate
* Considerations to remove dependency on Node's require thus not needing to supply base URL
* Circular dependency prevention
* Benchmarking for memory management and overall performance
