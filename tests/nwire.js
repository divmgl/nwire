var expect = require('chai').expect;
var wire = require('../nwire')

describe('nwire', function() {
  it('should callback with object', function(done){
    wire({}, function(err, app) {
      expect(app).to.not.equal(null);
      done();
    });
  });

  it('should throw an error when invalid callback', function() {
    expect(function() {
      wire({}, "string");
    }).to.throw;
  });

  it('should return a simple package', function(done) {
    wire({ 'prov': { value: 123 } }, function(err, app) {
      expect(app.prov.value).to.equal(123);
      done();
    });
  });

  it('should inject a package', function(done) {
    wire({
      'prov': { value: 123 },
      'cons': {
        needs: ['prov'],
        fn: function($) { return { consumedValue: $.prov.value }; }
      }
    }, function(err, app) {
      expect(app.cons.consumedValue).to.equal(123);
      done();
    });
  });

  it('should resolve nested dependencies within objects', function(done) {
    wire({
      'nested': {
        'prov': { value: 123 },
        'cons': {
          needs: ['prov'],
          fn: function($) { return { consumedValue: $.prov.value }; }
        }
      }
    }, function(err, app) {
      expect(app.nested.cons.consumedValue).to.equal(123);
      done();
    });
  });

  it('should resolve parent dependencies', function(done) {
    wire({
      'prov': { value: 123 },
      'nested': {
        'nested': {
          'nested': {
            'cons': {
              needs: ['prov'],
              fn: function($) { return { consumedValue: $.prov.value }; }
            }
          }
        }
      }
    }, function(err, app) {
      expect(app.nested.nested.nested.cons.consumedValue).to.equal(123);
      done();
    })
  });

  it('should not crash on circular dependency', function(done) {
    wire({
      'provc': {
        needs: ["consc"],
        fn: function ($) { return { value: $.consc.consumedValue || 123 }; }
      },
      'consc': {
        needs: ["provc"],
        fn: function ($) { return { consumedValue: $.provc.value }; }
      }
    }, function(err, app){
      expect(app.provc.value).to.equal(123);
      done();
    });
  });

  it('should not be able to replace providers', function(done) {
    wire({
      'prov': {
        value: 123
      },
      'cons': {
        needs: ["prov"],
        fn: function($) { $.prov = { value: 456 }; }
      }
    }, function(err, app) {
      expect(app.prov.value).to.equal(123);
      done();
    });
  });

  it('should ignore wiring when ignore flag is on', function(done) {
    wire({
      'prov': {
        needs: [],
        fn: function($) { return { value: 123 } },
        ignore: true
      }
    }, function(err, app) {
      expect(app.prov.fn().value).to.equal(123);
      done();
    })
  });

  it('handles errors gracefully', function(done) {
    wire({
      'prov': {
        throws: function() {
          throw new Error("Stuff happened");
        }
      },
      'cons': {
        needs: ['prov'],
        fn: function($){
          $.prov.throws();
        }
      }
    }, function (err, app){
      expect(err).to.not.equal(null);
      done();
    })
  });

  it('handles unknown packages gracefully', function(done) {
    wire({
      'cons': {
        needs: ['prov'],
        fn: function($) {
          return {
            prov: $.prov
          };
        }
      }
    }, function (err, app){
      expect(err).to.equal(null);
      expect(app).to.not.equal(undefined);
      expect(app.cons.prov).to.equal(undefined);
      expect(app.cons).to.not.equal(undefined);
      done();
    });
  });

  it('handles odd characters', function(done) {
    wire({
      'asdf!@#$': "hi",
      'cons': {
        needs: ['asdf!@#$'],
        fn: function($){
          return {
            value: $["asdf!@#$"]
          }
        }
      }
    }, function(err, app){
      expect(app.cons.value).to.equal("hi");
      done();
    });
  });
});