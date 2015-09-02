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

wire(config, function(err, app){ // Composite root
  if (err) throw err; // Something happened while building dependencies
  app.packages.server.listen(3000);
});
```
```js
// server.js
module.exports.needs = ['express'];
module.exports.fn = function($){
  var app = $.express();

  // Add your routes and configuration here
  
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

Dependency injection shouldn't be complicated. `nwire.js` encourages loosely coupled functionality and simplifies the process of isolating your code for testing.

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
module.exports.fn = function(imports) { // You can use $ for short
  var auth = imports.auth; // The auth module is injected
  auth.login('testing', '123', function(err){
    // Handle whether user is authorized
  });
}
```
If the `fn` property is not provided, nwire.js will not perform any dependency injection. If the `needs` property is not provided, the `imports` parameter will be empty.

### Package discovery

In order to perform dependency injection, you must feed nwire.js a configuration object containing the `url` and `packages` properties.

The `url` property allows nwire.js to resolve packages without needing their absolute paths. In most configurations, assigning `__dirname` to the `url` property will do. If this property is not provided, nwire.js will attempt to resolve modules from within its own directory.

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

## Suggestions and questions

If you have any suggestions or questions regarding this project, please open an issue. If you feel that you have a feature that would be useful to add, fork it and open a pull request.