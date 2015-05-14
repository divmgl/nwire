# nwire
Inspirational dependency injection in Node.js.

## Installation
`$ npm install nwire`

## Example

Here's an example using Express.js.

```js
// index.js
var wire = require('nwire');
var config = { // This can go in a config.js
  url: __dirname, // Base URL 
  packages: { // Packages to be injected
    'server': './server',
    'express': 'express'
  }
}

wire(config, function(err, app){
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