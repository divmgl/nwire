var expect = require('chai').expect;
var wire = require('../');
var _ = require('lodash');
var config = {
  url: __dirname,
  packages: {
    'leech': './leechModule',
    'seed': './seedModule'
  }
}

describe('nwire', function() {
  it('should return an object on callback', function(done) {
    wire(config, function(err, app) {
      expect(err).to.be.null;
      expect(app).to.not.be.null;
      expect(app).to.be.a('object');
      done();
    });
  });

  it('should not accept an empty configuration', function(done) {
    wire(null, function(err, app) {
      expect(err).to.not.be.null;
      done();
    });
  });
});

describe('nwire application', function() {
  wire(config, function(err, app) {
    it('should not have an error', function(done) {
      expect(err).to.be.null;
      done();
    });

    it('should have a packages object', function(done) {
      expect(app.packages).to.be.a('object');
      done();
    });

    it('should have two packages', function(done) {
      expect(_.size(app.packages)).to.equal(2);
      done();
    });

    it('leech package should be an object', function(done) {
      expect(app.packages.leech).to.be.a('object');
      done();
    });
  });

  wire('chai', function(err, app) {
    it('should throw an error when a package definition is not an object',
      function(done) {
        expect(err).to.not.be.null;
        done();
      });
  });
});

describe('module', function() {
  wire(config, function(err, app) {
    it('should exist in application', function(done) {
      expect(app.packages.leech).to.not.be.undefined;
      done();
    });

    it('should have an object named generated', function(done) {
      expect(app.packages.leech.generated).to.not.be.undefined;
      done();
    });
  });
});