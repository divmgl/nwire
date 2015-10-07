require('chai').should();

var wire = require('..');
var configurationFixture = require('./fixtures/config');
var circularConfigurationFixture = require('./fixtures/circular/config');

describe('packages', function(){
  var app;

  beforeEach(function(){
    app = wire(configurationFixture);
  });

  it('should not crash on empty needs', function(){
    app.packages.emptyNeeds.should.be.a('object');
  });

  describe('consumers', function(){
    it('should be able to access imports', function(){
      app.packages.consumer.imports.provider.member.should.equal(true);
    });

    it('should be able to modify imports', function(){
      app.packages.consumer.changeProvider();
      app.packages.provider.member.should.equal(false);
    });
  })
  describe('providers', function(){
    it('that are providers should expose properties', function() {
      app.packages.provider.dummyFn.should.be.a('function');
    });
  });
});
