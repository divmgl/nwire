var expect = require('chai').expect;
var _ = require('lodash');

var wire = require('..');
var leech = require('./mocks/leech');
var seed = require('./mocks/seed');

var configurationMock = {
  url: __dirname,
  packages: {
    'leech': './mocks/leech',
    'seed': './mocks/seed'
  }
}

var circularConfigurationMock = {
  url: __dirname,
  packages: {
    'leech': './mocks/circular/leech',
    'seed': './mocks/circular/seed'
  }
}

describe('nwire', function() {
  it('returns an object on callback', function() {
    var app = wire({});

    expect(app).to.not.be.null;
    expect(app).to.be.a('object');
  });

  it('throws an error when empty configuration provided', function() {
    expect(function() {
      wire(null);
    }).to.throw("Please provide a valid configuration object.");
  });

  it('throws an error when configuration parameter is not an object', function(){
    expect(function(){
      wire(String());
    }).to.throw();
  })

  it('does not crash when module not found', function() {
    expect(function() {
      wire({
        packages: {
          'fake': './fake'
        }
      });
    }).to.not.throw();
  });

  it('does not have an error on valid configuration', function() {
    expect(function() {
      wire(configurationMock)
    }).to.not.throw();
  });
});

describe('nwire application', function() {
  it('has a packages object', function() {
    var app = wire({});
    expect(app.packages).to.be.a('object');
  });

  it('has two packages when passed two valid definitions', function() {
    var app = wire(configurationMock);
    expect(_.size(app.packages)).to.equal(2);
  });

  it('has no packages when passed two invalid definitions', function(){
    var app = wire({packages: {'1': './1', '2': './2'}});
    expect(_.size(app.packages)).to.equal(0);
  });

  it('does not throw an error on circular dependencies', function(){
    var app = wire(circularConfigurationMock);
    expect(_.size(app.packages)).to.equal(2);
  });
});

describe('leech mock', function(){
  it('has a consumed package', function(){
    var app = wire(configurationMock);
    expect(_.size(app.packages.leech.imports)).to.equal(1);
  });

  it('has the consumed seed mock', function(){
    var app = wire(configurationMock);
    expect(app.packages.leech.imports.seed).to.not.be.undefined;
  });

  it('is able to access exposed children from seed mock', function(){
    var app = wire(configurationMock);
    expect(app.packages.leech.imports.seed.dummyFn).to.not.be.undefined;
  });

  it('is able to access exposed children from seed circular dependency mock', function(){
    var app = wire(circularConfigurationMock);
    expect(app.packages.leech.imports.seed.dummyFn).to.not.be.undefined;
  });
});