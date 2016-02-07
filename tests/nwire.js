var expect = require('chai').expect;
var wire = require('../nwire')

describe('nwire', function() {
  it('should callback with object', function(){
    var app = wire({});
    expect(app).to.not.equal(null);
  });

  it('should return a simple package', function() {
    var app = wire({ 'prov': { value: 123 } });
    expect(app.prov.value).to.equal(123);
  });

  it('should inject a package', function() {
    var app = wire({
      'prov': { value: 123 },
      'cons': {
        needs: ['prov'],
        fn: function($) { return { consumedValue: $.prov.value }; }
      }
    });

    expect(app.cons.consumedValue).to.equal(123);
  });

  it('should resolve nested dependencies within objects', function() {
    var app = wire({
      'nested': {
        'prov': { value: 123 },
        'cons': {
          needs: ['prov'],
          fn: function($) { return { consumedValue: $.prov.value }; }
        }
      }
    });
    
    expect(app.nested.cons.consumedValue).to.equal(123);
  });

  it('should resolve parent dependencies', function() {
    var app = wire({
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
    });
    
    expect(app.nested.nested.nested.cons.consumedValue).to.equal(123);
  });

  it('should gather values from future packages', function() {
    var app = wire({
      'cons': {
        needs: ["prov"],
        fn: function ($) { 
          return { value: $.prov }; 
        }
      },
      'prov': {
        needs: [],
        fn: function ($) { return 123; }
      }
    });
      
    expect(app.cons.value).to.equal(123);
  });

  it('should not be able to replace providers', function() {
    var app = wire({
      'prov': {
        value: 123
      },
      'cons': {
        needs: ["prov"],
        fn: function($) { $.prov = { value: 456 }; }
      }
    });
    
    expect(app.prov.value).to.equal(123);
  });

  it('should ignore wiring when ignore flag is on', function() {
    var app = wire({
      'prov': {
        needs: [],
        fn: function($) { return { value: 123 } },
        ignore: true
      }
    });
    
    expect(app.prov.fn().value).to.equal(123);
  });

  it('handles unknown packages gracefully', function() {
    var app = wire({
      'cons': {
        needs: ['prov'],
        fn: function($) {
          return {
            prov: $.prov
          };
        }
      }
    });

    expect(app).to.not.equal(undefined);
    expect(app.cons.prov).to.equal(undefined);
    expect(app.cons).to.not.equal(undefined);
  });

  it('handles odd characters', function() {
    var app = wire({
      'asdf!@#$': "hi",
      'cons': {
        needs: ['asdf!@#$'],
        fn: function($){
          return {
            value: $["asdf!@#$"]
          }
        }
      }
    });
    
    expect(app.cons.value).to.equal("hi");
  });
});