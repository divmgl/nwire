require('chai').should();
var wire = require('..');

describe('nwire', function(){
  it('should return an object', function(){
    var app = wire({});
    app.should.be.a('object');
  })

  it('should return an object on callback', function(done){
    wire({}, function(err, app){
      app.should.be.a('object');
      done();
    });
  });

  it('throws an error when configuration undefined', function(){
    (function(){
      wire();
    }).should.throw();
  });

  it('throws an error when configuration not an object', function(){
    (function(){
      wire(String());
    }).should.throw();
  });

  it('does not crash on invalid package', function() {
    (function(){
      wire({ packages: { 'asdf' : './asdf' }});
    }).should.not.throw();
  });

  describe('application', function(){
    var configurationFixture = require('./fixtures/config');
    var circularConfigurationFixture = require('./fixtures/circular/config');

    it('should be able to access packages', function(){
      var app = wire(configurationFixture);
      app.packages.consumer.should.be.a('object');
      app.packages.provider.should.be.a('object');
    });

    it('does not crash on circular dependency', function(){
      var app = wire(configurationFixture);
      app.packages.consumer.should.be.a('object');
      app.packages.provider.should.be.a('object');
    });
  });
});
